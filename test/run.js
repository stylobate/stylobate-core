var fs = require('fs');
var glob = require('glob');
var whatToTest = process.env.npm_package_config_whatToTest || '';
var stylobate = require('../lib/stylobate.js');

glob.sync("./test/*" + whatToTest + "*.stylobate.css").forEach(function(test){
    var name = test.replace(/\.?[\/]/g, ' ').replace(' tests',':').replace('.stylobate.css','');

    it(name, function(){
        var source = fs.readFileSync(test, 'utf8').replace(/\r/g, '').trim();
        var expected_css = fs.readFileSync(test.replace('.stylobate.css', '.css'), 'utf8').replace(/\r/g, '').trim();
        var stylobated_css = stylobate(source);
        var result = stylobated_css.toResult({
            from: test.replace('./test/', ''),
            to: test.replace('.stylobate.css', '.css'),
            map: true
        });
        fs.writeFileSync(test.replace('.stylobate.css', '.css.map'), result.map);
        result.css.trim().should.equal(expected_css);
    });
});
