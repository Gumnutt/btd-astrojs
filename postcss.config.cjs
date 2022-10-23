const postcssJitProps = require("postcss-jit-props")
const OpenProps = require("open-props")
const postcssCustomMedia = require("postcss-custom-media")
const postcssNested = require("postcss-nested")
module.exports = {
  plugins: [
    postcssJitProps(OpenProps),
    postcssCustomMedia({
      importFrom: "./node_modules/open-props/media.min.css",
    }),
    postcssNested,
  ],
}
