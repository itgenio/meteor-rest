const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const { createRequire } = require("node:module");
const path = require("node:path");
const { Readable } = require("node:stream");
const test = require("node:test");
const vm = require("node:vm");

const packageRequire = createRequire(
  path.join(__dirname, ".npm/package/package.json")
);
const bodyParser = packageRequire("body-parser");
const connect = packageRequire("connect");
const source = fs.readFileSync(path.join(__dirname, "json-routes.js"), "utf8");

const request = ({
  method = "POST",
  body,
  contentType = "application/json",
  upstream = false,
}) => {
  const app = connect();
  let upstreamReads = 0;

  if (upstream) {
    app.use(
      "/verify-parser",
      bodyParser.json({
        verify(req, res, rawBody) {
          upstreamReads++;
          req.rawBody = rawBody;
        },
      })
    );
  }

  const context = vm.createContext({
    Npm: { require: packageRequire },
    WebApp: { connectHandlers: app },
    Meteor: {
      bindEnvironment: (handler) => handler,
      startup: (handler) => handler(),
    },
    _: {
      each: (values, callback) =>
        Object.keys(values).forEach((key) => callback(values[key], key)),
      isFunction: (value) => typeof value === "function",
    },
    process,
  });
  vm.runInContext(source, context);

  return new Promise((resolve, reject) => {
    const req = new http.IncomingMessage(new Readable({ read() {} }));
    const res = new http.ServerResponse(req);
    req.url = "/verify-parser";
    req.method = method;
    req.headers = {};

    if (body !== undefined) {
      req.headers["content-type"] = contentType;
      req.headers["content-length"] = String(Buffer.byteLength(body));
    }

    context.JsonRoutes.add(method, "/verify-parser", (request, response) => {
      context.JsonRoutes.sendResult(response);
    });

    res.end = () => resolve({ req, status: res.statusCode, upstreamReads });
    app(req, res, (error) => {
      if (!error) return reject(new Error("Route was not reached"));
      resolve({
        req,
        status: error.status || error.statusCode || 500,
        error,
        upstreamReads,
      });
    });
    if (body !== undefined) req.push(Buffer.from(body));
    req.complete = true;
    req.push(null);
  });
};

test("does not reread JSON parsed by upstream body-parser 2.x", async () => {
  const body =
    '{ "event": "payment_intent.succeeded", "description": "Тест оплаты" }\n';
  const result = await request({ body, upstream: true });
  assert.ifError(result.error);
  assert.equal(result.status, 200);
  assert.equal(result.upstreamReads, 1);
  assert.deepEqual(result.req.body, JSON.parse(body));
  assert.deepEqual(result.req.rawBody, Buffer.from(body));
  const signature = crypto
    .createHmac("sha256", "local-secret")
    .update(body)
    .digest("hex");
  assert.equal(
    crypto
      .createHmac("sha256", "local-secret")
      .update(result.req.rawBody)
      .digest("hex"),
    signature
  );
});

test("parses ordinary JSON", async () => {
  const result = await request({
    body: '{"amount":12720,"metadata":{"familyId":"family"}}',
  });
  assert.equal(result.status, 200);
  assert.deepEqual(result.req.body, {
    amount: 12720,
    metadata: { familyId: "family" },
  });
});

test("preserves JSON array bodies used by REST method arguments", async () => {
  const result = await request({ body: '["family",12720]' });
  assert.equal(result.status, 200);
  assert.deepEqual(result.req.body, ["family", 12720]);
});

test("parses URL-encoded form fields and repeated fields", async () => {
  const result = await request({
    body: "token=abc&value=1&value=2",
    contentType: "application/x-www-form-urlencoded",
  });
  assert.equal(result.status, 200);
  assert.deepEqual({ ...result.req.body }, { token: "abc", value: ["1", "2"] });
});

for (const options of [
  { method: "GET" },
  { method: "POST" },
  { body: "" },
  { body: "unparsed", contentType: "text/plain" },
]) {
  test(`preserves empty body object: ${JSON.stringify(options)}`, async () => {
    const result = await request(options);
    assert.equal(result.status, 200);
    assert.equal(JSON.stringify(result.req.body), "{}");
  });
}

test("rejects malformed JSON with HTTP 400", async () => {
  const result = await request({ body: "{invalid" });
  assert.equal(result.status, 400);
  assert.equal(result.error.type, "entity.parse.failed");
});

test("preserves JSON request size limit above the body-parser default", async () => {
  const value = "a".repeat(128 * 1024);
  const result = await request({ body: JSON.stringify({ value }) });
  assert.equal(result.status, 200);
  assert.equal(result.req.body.value, value);
});
