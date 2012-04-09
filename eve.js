// ┌──────────────────────────────────────────────────────────────────────────────────────┐ \\
// │ Eve 0.3.4 - JavaScript Events Library                                                │ \\
// ├──────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright (c) 2008-2011 Dmitry Baranovskiy (http://dmitry.baranovskiy.com/)          │ \\
// │ Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license. │ \\
// └──────────────────────────────────────────────────────────────────────────────────────┘ \\

(function (glob) {
    var version = "0.3.4",
        has = "hasOwnProperty",
        separator = /[\.\/]/,
        wildcard = "*",
        fun = function () {},
        numsort = function (a, b) {
            return a - b;
        },
        current_event,
        stop,
        events = {n: {}},
    /*\
     * eve
     [ method ]
     **
     * Fires event with given `name`, given scope and other parameters.
     **
     > Arguments
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated
     - scope (object) context for the event handlers
     - varargs (...) the rest of arguments will be sent to event handlers
     **
     = (object) array of returned values from the listeners
    \*/
        eve = function (name, scope) {
            var e = events,
                oldstop = stop,
                args = Array.prototype.slice.call(arguments, 2),
                listeners = eve.listeners(name, scope),
                z = 0,
                f = false,
                l,
                indexed = [],
                queue = {},
                out = [],
                ce = current_event,
                errors = [];
            current_event = name;
            stop = 0;
            for (var i = 0, ii = listeners.length; i < ii; i++) if ("zIndex" in listeners[i]) {
                indexed.push(listeners[i].zIndex);
                if (listeners[i].zIndex < 0) {
                    queue[listeners[i].zIndex] = listeners[i];
                }
            }
            indexed.sort(numsort);
            while (indexed[z] < 0) {
                l = queue[indexed[z++]];
                out.push(l.apply(scope, args));
                if (stop) {
                    stop = oldstop;
                    return out;
                }
            }
            for (i = 0; i < ii; i++) {
                l = listeners[i];
                if ("zIndex" in l) {
                    if (l.zIndex == indexed[z]) {
                        out.push(l.apply(scope, args));
                        if (stop) {
                            break;
                        }
                        do {
                            z++;
                            l = queue[indexed[z]];
                            l && out.push(l.apply(scope, args));
                            if (stop) {
                                break;
                            }
                        } while (l)
                    } else {
                        queue[l.zIndex] = l;
                    }
                } else {
                    out.push(l.apply(scope, args));
                    if (stop) {
                        break;
                    }
                }
            }
            stop = oldstop;
            current_event = ce;
            return out.length ? out : null;
        };
    /*\
     * eve.listeners
     [ method ]
     **
     * Internal method which gives you array of all event handlers that will be triggered by the given `name`.
     **
     > Arguments
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated
     - scope (object) optional constraint on the context of the triggered event
     **
     = (array) array of event handlers
    \*/
    eve.listeners = function (name, scope) {
        var names = name.split(separator),
            e = events,
            item,
            items,
            k,
            i,
            ii,
            j,
            jj,
            l,
            ll,
            nes,
            es = [e],
            out = [];
        for (i = 0, ii = names.length; i < ii; i++) {
            nes = [];
            for (j = 0, jj = es.length; j < jj; j++) {
                e = es[j].n;
                items = [e[names[i]], e[wildcard]];
                k = 2;
                while (k--) {
                    item = items[k];
                    if (item) {
                        nes.push(item);
                        if (item.f) {
                            out = out.concat(item.f);
                        }
                        if (scope) {
                            for(l = 0, ll = item.scopes && item.scopes.length; l < ll; l++ ) {
                                if (item.scopes[l].scope === scope) {
                                    out = out.concat(item.scopes[l].f);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            es = nes;
        }
        return out;
    };
    
    /*\
     * eve.on
     [ method ]
     **
     * Binds given event handler with a given name. You can use wildcards “`*`” for the names:
     | eve.on("*.under.*", f);
     | eve("mouse.under.floor"); // triggers f
     | eve.on("*.under.*", myObj, f);
     | eve("mouse.under.floor", myObj); // triggers f
     * Use @eve to trigger the listener.
     **
     > Arguments
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - scope (object) optional constraint on the context of the event triggered.
     - f (function) event handler function
     **
     = (function) returned function accepts a single numeric parameter that represents z-index of the handler. It is an optional feature and only used when you need to ensure that some subset of handlers will be invoked in a given order, despite of the order of assignment. 
     > Example:
     | eve.on("mouse", eat)(2);
     | eve.on("mouse", scream);
     | eve.on("mouse", catch)(1);
     * This will ensure that `catch` function will be called before `eat`.
     * If you want to put your handler before non-indexed handlers, specify a negative value.
     * Note: I assume most of the time you don’t need to worry about z-index, but it’s nice to have this feature “just in case”.
    \*/
    eve.on = function (name, scope, f) {
        var names = name.split(separator),
            e = events,
            funcList;

        if (!f) {
            f = scope;
            scope = undefined;
        }

        for (var i = 0, ii = names.length; i < ii; i++) { // get or create namespace
            e = e.n;
            !e[names[i]] && (e[names[i]] = {n: {}});
            e = e[names[i]];
        }

        if (scope) {
            e.scopes || (e.scopes = []);

            for (i = 0, ii = e.scopes.length; i < ii; i++) if (e.scopes[i].scope === scope) {
                funcList = e.scopes[i].f;
                break;
            }
            if (i >= ii) { // create scope if not found
                e.scopes.push({
                    scope : scope,
                    f : funcList = []
                });
            }
        } else {
            funcList = e.f = e.f || [];
        }

        for (i = 0, ii = funcList.length; i < ii; i++) if (funcList[i] == f) {
            return fun;
        }

        funcList.push(f);
        return function (zIndex) {
            if (+zIndex == +zIndex) {
                f.zIndex = +zIndex;
            }
        };
    };
    /*\
     * eve.stop
     [ method ]
     **
     * Is used inside an event handler to stop the event, preventing any subsequent listeners from firing.
    \*/
    eve.stop = function () {
        stop = 1;
    };
    /*\
     * eve.nt
     [ method ]
     **
     * Could be used inside event handler to figure out actual name of the event.
     **
     > Arguments
     **
     - subname (string) #optional subname of the event
     **
     = (string) name of the event, if `subname` is not specified
     * or
     = (boolean) `true`, if current event’s name contains `subname`
    \*/
    eve.nt = function (subname) {
        if (subname) {
            return new RegExp("(?:\\.|\\/|^)" + subname + "(?:\\.|\\/|$)").test(current_event);
        }
        return current_event;
    };

    //remove a specific function from an array of functions
    function unbindForFuncList(funcList, f) {
        for (var i = 0, ii = funcList.length; i < ii; i++) if (funcList[i] == f) {
            funcList.splice(i, 1);
            break;
        }
    }

    // unbind a given namespace. scope and function constraints are required, but are ignored if falsy.
    // child namespaaces will also be unbound, using the same scope and function constraints.
    function unbindAtNamespace(namespace, scope, f) {
        var e = namespace,
            i,
            ii;
        if (f) { // unbind single handler
            for (i = 0, ii = e.scopes && e.scopes.length; i < ii; i++) {
                if (!scope || e.scopes[i].scope === scope) { // if they didn't provide a scope, we unbind every scope. if they provided one, only unbind that one.
                    unbindForFuncList(e.scopes[i].f, f);
                    !e.scopes[i].f.length && e.scopes.splice(i, 1);
                    break;
                }
            }
            if (e.f && !scope) { // unbind unscoped handlers only if no scope was provided.
                unbindForFuncList(e.f, f);
                for (i = 0, ii = e.f.length; i < ii; i++) if (e.f[i] == f) {
                    e.f.splice(i, 1);
                    !e.f.length && delete e.f;
                    break;
                }
            }
        } else if (scope) { // unbind all for scope
            for (i = 0, ii = e.scopes && e.scopes.length; i < ii; i++) {
                if (e.scopes[i] === scope) {
                    e.scopes.splice(i, 1);
                    break;
                }
            }
        } else { // unbind all handlers in this namespace and in sub-namespaces
            delete e.f;
            delete e.scopes;
            e.n = {};
            return; // we're done recursing.
        }

        //apply same logic to nested namespaces
        for (key in e.n) if (e.n[has](key)) {
            unbindAtNamespace(e.n[key], scope, f);
        }
    }

    /*\
     * eve.unbind
     [ method ]
     **
     * Removes given function from the list of event listeners assigned to given name.
     **
     > Arguments
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
    \*/
    eve.unbind = function (name, scope, f) {
        var names = name.split(separator),
            e,
            key,
            splice,
            i, ii, j, jj,
            cur = [events];

        if (!f) {
            f = scope;
            scope = undefined;
        }

        // collect all the namespaces specified by the name parameter
        for (i = 0, ii = names.length; i < ii; i++) {
            for (j = 0; j < cur.length; j += splice.length - 2) {
                splice = [j, 1];
                e = cur[j].n;
                if (names[i] != wildcard) {
                    if (e[names[i]]) {
                        splice.push(e[names[i]]);
                    }
                } else {
                    for (key in e) if (e[has](key)) {
                        splice.push(e[key]);
                    }
                }
                cur.splice.apply(cur, splice);
            }
        }

        // remove handlers from the collected namespaces
        for (i = 0, ii = cur.length; i < ii; i++) {
            unbindAtNamespace(cur[i], scope, f);
        }
    };
    /*\
     * eve.once
     [ method ]
     **
     * Binds given event handler with a given name to only run once then unbind itself.
     | eve.once("login", f);
     | eve("login"); // triggers f
     | eve("login"); // no listeners
     * Use @eve to trigger the listener.
     **
     > Arguments
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
     **
     = (function) same return function as @eve.on
    \*/
    eve.once = function (name, scope, f) {
        if (!f) {
            f = scope;
            scope = undefined;
        }
        var f2 = function () {
            var res = f.apply(this, arguments);
            eve.unbind(name, scope, f2);
            return res;
        };
        return eve.on(name, scope, f2);
    };
    /*\
     * eve.version
     [ property (string) ]
     **
     * Current version of the library.
    \*/
    eve.version = version;
    eve.toString = function () {
        return "You are running Eve " + version;
    };
    (typeof module != "undefined" && module.exports) ? (module.exports = eve) : (typeof define != "undefined" ? (define("eve", [], function() { return eve; })) : (glob.eve = eve));
})(this);
