"use strict";

const isAutoprefixable = require("../../utils/isAutoprefixable");
const isStandardSyntaxDeclaration = require("../../utils/isStandardSyntaxDeclaration");
const isStandardSyntaxProperty = require("../../utils/isStandardSyntaxProperty");
const report = require("../../utils/report");
const ruleMessages = require("../../utils/ruleMessages");
const styleSearch = require("style-search");
const unprefixDecl = require("postcss-unprefix/lib/clearDecl");
const validateOptions = require("../../utils/validateOptions");

const ruleName = "value-no-vendor-prefix";

const messages = ruleMessages(ruleName, {
  rejected: value => `Unexpected vendor-prefix "${value}"`
});

const valuePrefixes = ["-webkit-", "-moz-", "-ms-", "-o-"];

const rule = function(expectation, options, context) {
  return (root, result) => {
    const validOptions = validateOptions(result, ruleName, {
      actual: expectation
    });
    if (!validOptions) {
      return;
    }

    root.walkDecls(decl => {
      if (
        !isStandardSyntaxDeclaration(decl) ||
        !isStandardSyntaxProperty(decl.prop) ||
        decl.value[0] !== "-"
      ) {
        return;
      }

      const prop = decl.prop,
        value = decl.value;

      // Search the full declaration in order to get an accurate index

      styleSearch(
        { source: value.toLowerCase(), target: valuePrefixes },
        match => {
          const fullIdentifier = /^(-[a-z-]+)\b/i.exec(
            value.slice(match.startIndex)
          )[1];
          if (!isAutoprefixable.propertyValue(prop, fullIdentifier)) {
            return;
          }

          // Fix
          if (context.fix) {
            unprefixDecl(decl);
            if (!decl.parent || decl.prop !== prop) {
              return;
            }
          }

          report({
            message: messages.rejected(fullIdentifier),
            node: decl,
            index:
              prop.length + (decl.raws.between || "").length + match.startIndex,
            result,
            ruleName
          });
        }
      );
    });
  };
};

rule.ruleName = ruleName;
rule.messages = messages;
module.exports = rule;
