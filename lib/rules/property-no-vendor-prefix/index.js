"use strict"

const isAutoprefixable = require("../../utils/isAutoprefixable")
const report = require("../../utils/report")
const ruleMessages = require("../../utils/ruleMessages")
const validateOptions = require("../../utils/validateOptions")
const unprefixDecl = require("postcss-unprefix/lib/clearDecl")

const ruleName = "property-no-vendor-prefix"

const messages = ruleMessages(ruleName, {
  rejected: property => `Unexpected vendor-prefix "${property}"`,
})

const rule = function (expectation, options, context) {
  return (root, result) => {
    const validOptions = validateOptions(result, ruleName, {
      actual: expectation,
    })
    if (!validOptions) {
      return
    }

    root.walkDecls(decl => {
      const prop = decl.prop

      // Make sure there's a vendor prefix,
      // but this isn't a custom property

      if (prop[0] !== "-" || prop[1] === "-") {
        return
      }

      if (!isAutoprefixable.property(prop)) {
        return
      }

      // Fix
      if (context.fix) {
        unprefixDecl(decl)
        if (!decl.parent || decl.prop !== prop) {
          return
        }
      }

      report({
        message: messages.rejected(prop),
        node: decl,
        result,
        ruleName,
      })
    })
  }
}

rule.ruleName = ruleName
rule.messages = messages
module.exports = rule
