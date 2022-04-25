const Koa = require('koa');
const KoaStatic = require('koa-static');
const app = new Koa();
app.use(KoaStatic('./'));
app.use(async (ctx) => {
  ctx.body = 'Hello World';
});

app.listen(3000, () => {
  console.log('\x1B[36m%s\x1B[0m', 'server listen in 3000\nplease open http://localhost:3000/demo.html');
});
