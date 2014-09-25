var postcss = require('postcss');
var postcss_list = require('postcss/lib/list');

var stylobate = function(css, opts){
    var parsed_css = postcss.parse(css, opts);
    var stylobate_properties = {};
    var stylobate_templates = {};

    // Gather the content of all CSSCSS at-rules and move to CSSCSS root
    parsed_css.eachAtRule(function (atRule) {
        if (atRule.name !== 'stylobate') return;

        // TODO: proper parsing of `atRule.params` to the prop getter
        if (!(atRule.params in stylobate_properties)) {
            stylobate_properties[atRule.params] = {
                'node': atRule,
                'root': postcss.root(),
                'templates': {}
            };
        }

        // Append all rules and at-rules to the Stylobate root
        atRule.each(function (rule) {
            if (!(rule.type === 'rule' || rule.type === 'atrule')) return;
            stylobate_properties[atRule.params].root.append(rule);
        });

        // Remove all the CSSCSS stuff from the initial CSS
        atRule.removeSelf();
    });


    // Collect stylobate rules
    stylobate_property = stylobate_properties['skin'];
    stylobate_property.root.each(function(node){
        if (node.type === 'atrule') {
            if (!(node.name in stylobate_property.templates)) {
                stylobate_property.templates[node.name] = [];
            }
            var default_template = {
                'selector': ':root',
                'decls': []
            };
            node.each(function(subNode) {
                if (subNode.type === 'decl') {
                    default_template.decls.push(subNode);
                }
                if (subNode.type === 'rule') {
                    // TODO: iterate through `subNode.selectors` instead
                    var rule_template = {
                        'selector': subNode.selector,
                        'decls': []
                    }
                    subNode.each(function(subSubNode) {
                        if (subSubNode.type === 'decl') {
                            rule_template.decls.push(subSubNode);
                        }
                    });
                    stylobate_property.templates[node.name].push(rule_template);
                }

            });

            stylobate_property.templates[node.name].push(default_template);
        }
    });

    parsed_css.eachDecl(function(decl) {
        if (decl.prop in stylobate_properties) {
            var prop = stylobate_properties[decl.prop];
            var values = postcss_list.space(decl.value);
            var name = values[0];
            // TODO: Need proper parser of params
            var params = values.slice(1, values.length);

            if (name in prop.templates) {
                var templates = prop.templates[name];
                for (var i = 0; i < templates.length; i++) {
                    var template = templates[i];
                    // TODO: do this after all the other stuff, or
                    //       prioritize using specificity
                    if (template.selector === ':root') {
                        for (var j = 0; j < template.decls.length; j++) {
                            decl.parent.insertBefore(decl, template.decls[j]);
                        }
                    }
                };
            } else {
                // TODO: No else needed, need to parse the `name_mod` and `name_` before
            }

            // When all done, remove the matched stylobate decl
            decl.removeSelf();
        }
    });
    return parsed_css;
}

module.exports = stylobate;
