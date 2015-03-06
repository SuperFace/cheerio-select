var parse = require("css-what"),
    compile = require("css-select")._compileToken,
    domutils = require("domutils"),
    findAll = domutils.findAll,
    getChildren = domutils.getChildren,
    removeSubsets = domutils.removeSubsets;

var filters = {
    __proto__: null,
    first: function(elems){
        return elems.length > 0 [elems[0]];
    },
    last: function(elems){
        return elems.length > 0 && [elems[elems.length - 1]];
    },
    eq: function(elems, data){
        var num = parseInt(data, 10);
        if(!isFinite(num) || Math.abs(num) >= elems.length) return;
        return [num < 0 ? elems[elems.length - num] : elems[num]];
    },
    gt: function(elems, data){
        var num = parseInt(data, 10);
        if(!isFinite(num)) return;
        return elems.slice(num);
    },
    lt: function(elems, data){
        var num = parseInt(data, 10);
        if(!isFinite(num)) return;
        return elems.slice(0, num);
    },
    even: function(elems){
        return elems.filter(function(n, i){ return i % 2 === 0; });
    },
    odd: function(elems){
        return elems.filter(function(n, i){ return i % 2 === 1; });
    }
};

function isFilter(s){
    return s.type === "pseudo" && s.name in filters;
}

var arrPush = Array.prototype.push;

module.exports = function(root, selector, options){
    var sel = parse(selector);
    var results = [], newElems;

    for(var i = 0; i < sel.length; i++){
        for(var j = 0; j < sel[i].length; j++){
            if(isFilter(sel[i][j])){
                newElems = findFilterElements(results, root, sel[i], j, options);
                addElements(results, newElems);
                sel.splice(i, 1); //remove selector
            }
        }
    }

    if(sel.length){
        newElems = findElements(root, sel, options);
        addElements(results, newElems);
    }

    return results;
};

function addElements(results, newElems){
    //filter for duplicates
    elemLoop:
        for(var i = 0; i < newElems.length; i++){
            for(var j = 0; j < results.length; j++){
                if(newElems[i] === results[j]) continue elemLoop;
            }
            results.push(newElems[i]);
        }
}

function findFilterElements(result, root, sel, i, options){
    var sub = sel.slice(0, i);
    var filter = filters[sel[i].name];
    var cont = sel.slice(i + 1);

    var res = filters[filter.name](
        findElements(root, [sub], options),
        filter.data
    ) || [];

    if(!res.length || sel.length === i + 1){
        return res;
    }

    var rem = sel.slice(i + 1);

    //add a scope token in front of the remaining selector
    rem.unshift({type: "pseudo", name: "scope"});

    for(var j = 0; j < rem.length; j++){
        if(isFilter(rem[j])){
            return findFilterElements(result, root, rem, j, options);
        }
    }

    return findElements(res, rem, options);
}

function findElements(root, sel, options){
    var cmp = compile(sel, options, root);
    return findAll(cmp, Array.isArray(root) ? removeSubsets(root): getChildren(root));
}