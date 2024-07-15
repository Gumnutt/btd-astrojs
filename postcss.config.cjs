const postcssJitProps = require("postcss-jit-props")
const OpenProps = require("open-props")
const postcssNested = require("postcss-nested")
const postcssCustomMedia = require("postcss-custom-media")
module.exports = {
  plugins: [postcssJitProps(OpenProps), postcssNested, postcssCustomMedia],
}
