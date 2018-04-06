var net_lib = net_lib || {
    REVISION: 'ALPHA'
};
(function(global) {
    "use strict";

    // Random number utilities
    var return_v = false;
    var v_val = 0.0;
    var gaussRandom = function() {
        if (return_v) {
            return_v = false;
            return v_val;
        }
        var u = 2 * Math.random() - 1;
        var v = 2 * Math.random() - 1;
        var r = u * u + v * v;
        if (r == 0 || r > 1)
            return gaussRandom();
        var c = Math.sqrt(-2 * Math.log(r) / r);
        v_val = v * c; // cache this
        return_v = true;
        return u * c;
    }
    var seededGaussian = function(rng) {
        if (return_v) {
            return_v = false;
            return v_val;
        }
        var u = 2 * rng() - 1;
        var v = 2 * rng() - 1;
        var r = u * u + v * v;
        if (r == 0 || r > 1)
            return seededGaussian(rng);
        var c = Math.sqrt(-2 * Math.log(r) / r);
        v_val = v * c; // cache this
        return_v = true;
        return u * c;
    }
    var randf = function(a, b) {
        return Math.random() * (b - a) + a;
    }
    var randi = function(a, b) {
        return Math.floor(Math.random() * (b - a) + a);
    }
    var randn = function(mu, sigma) {
        return mu + gaussRandom() * Math.exp(sigma);
    }

    // Array utilities
    var zeros = function(n) {
        if (typeof(n) === 'undefined' || isNaN(n)) {
            return [];
        }
        if (typeof ArrayBuffer === 'undefined') {
            // lacking browser support
            var arr = new Array(n);
            for (var i = 0; i < n; i++) {
                arr[i] = 0;
            }
            return arr;
        } else {
            return new Float64Array(n);
        }
    }

    var setZero = function(arr) {
        for (var i = 0; i < arr.length; i++) {
            arr[i] = 0;
        }
    }

    var arrContains = function(arr, elt) {
        for (var i = 0, n = arr.length; i < n; i++) {
            if (arr[i] === elt)
                return true;
            }
        return false;
    }

    var arrUnique = function(arr) {
        var b = [];
        for (var i = 0, n = arr.length; i < n; i++) {
            if (!arrContains(b, arr[i])) {
                b.push(arr[i]);
            }
        }
        return b;
    }

    // return max and min of a given non-empty array.
    var maxmin = function(w) {
        if (w.length === 0) {
            return {};
        } // ... ;s
        var maxv = w[0];
        var minv = w[0];
        var maxi = 0;
        var mini = 0;
        var n = w.length;
        for (var i = 1; i < n; i++) {
            if (w[i] > maxv) {
                maxv = w[i];
                maxi = i;
            }
            if (w[i] < minv) {
                minv = w[i];
                mini = i;
            }
        }
        return {
            maxi: maxi,
            maxv: maxv,
            mini: mini,
            minv: minv,
            dv: maxv - minv
        };
    }

    // create random permutation of numbers, in range [0...n-1]
    var randperm = function(n) {
        var i = n,
            j = 0,
            temp;
        var array = [];
        for (var q = 0; q < n; q++)
            array[q] = q;
        while (i--) {
            j = Math.floor(Math.random() * (i + 1));
            temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }

    // sample from list lst according to probabilities in list probs
    // the two lists are of same size, and probs adds up to 1
    var weightedSample = function(lst, probs) {
        var p = randf(0, 1.0);
        var cumprob = 0.0;
        for (var k = 0, n = lst.length; k < n; k++) {
            cumprob += probs[k];
            if (p < cumprob) {
                return lst[k];
            }
        }
    }

    // syntactic sugar function for getting default parameter values
    var getopt = function(opt, field_name, default_value) {
        if (typeof field_name === 'string') {
            // case of single string
            return (typeof opt[field_name] !== 'undefined')
                ? opt[field_name]
                : default_value;
        } else {
            // assume we are given a list of string instead
            var ret = default_value;
            for (var i = 0; i < field_name.length; i++) {
                var f = field_name[i];
                if (typeof opt[f] !== 'undefined') {
                    ret = opt[f]; // overwrite return value
                }
            }
            return ret;
        }
    }

    function assert(condition, message) {
        if (!condition) {
            message = message || "Assertion failed";
            if (typeof Error !== "undefined") {
                throw new Error(message);
            }
            throw message; // Fallback
        }
    }

    global.randf = randf;
    global.randi = randi;
    global.randn = randn;
    global.zeros = zeros;
    global.setZero = setZero;
    global.seededGaussian = seededGaussian;
    global.maxmin = maxmin;
    global.randperm = randperm;
    global.weightedSample = weightedSample;
    global.arrUnique = arrUnique;
    global.arrContains = arrContains;
    global.getopt = getopt;
    global.assert = assert;

})(net_lib);

//Vol
(function(global) {
    "use strict";

    // Vol is the basic building block of all data in a net.
    // it is essentially just a 3D volume of numbers, with a
    // width (sx), height (sy), and depth (depth).
    // it is used to hold data for all filters, all volumes,
    // all weights, and also stores all gradients w.r.t.
    // the data. c is optionally a value to initialize the volume
    // with. If c is missing, fills the Vol with random numbers.
    var Vol = function(sx, sy, depth, c) {
        // this is how you check if a variable is an array. Oh, Javascript :)
        if (Object.prototype.toString.call(sx) === '[object Array]') {
            // we were given a list in sx, assume 1D volume and fill it up
            this.sx = 1;
            this.sy = 1;
            this.depth = sx.length;
            // we have to do the following copy because we want to use
            // fast typed arrays, not an ordinary javascript array
            this.w = global.zeros(this.depth);
            this.dw = global.zeros(this.depth);
            for (var i = 0; i < this.depth; i++) {
                this.w[i] = sx[i];
            }
        } else {
            // we were given dimensions of the vol
            this.sx = sx;
            this.sy = sy;
            this.depth = depth;
            var n = sx * sy * depth;
            this.w = global.zeros(n);
            this.dw = global.zeros(n);
            if (typeof c === 'undefined') {
                // weight normalization is done to equalize the output
                // variance of every neuron, otherwise neurons with a lot
                // of incoming connections have outputs of larger variance
                var scale = 0.1;
                for (var i = 0; i < n; i++) {
                    this.w[i] = global.randn(0.0, scale);
                }
            } else {
                for (var i = 0; i < n; i++) {
                    this.w[i] = c;
                }
            }
        }
    }

    Vol.prototype = {
        get: function(x, y, d) {
            var ix = ((this.sx * y) + x) * this.depth + d;
            return this.w[ix];
        },
        set: function(x, y, d, v) {
            var ix = ((this.sx * y) + x) * this.depth + d;
            this.w[ix] = v;
        },
        add: function(x, y, d, v) {
            var ix = ((this.sx * y) + x) * this.depth + d;
            this.w[ix] += v;
        },
        get_grad: function(x, y, d) {
            var ix = ((this.sx * y) + x) * this.depth + d;
            return this.dw[ix];
        },
        set_grad: function(x, y, d, v) {
            var ix = ((this.sx * y) + x) * this.depth + d;
            this.dw[ix] = v;
        },
        add_grad: function(x, y, d, v) {
            var ix = ((this.sx * y) + x) * this.depth + d;
            this.dw[ix] += v;
        },
        cloneAndZero: function() {
            return new Vol(this.sx, this.sy, this.depth, 0.0)
        },
        clone: function() {
            var V = new Vol(this.sx, this.sy, this.depth, 0.0);
            var n = this.w.length;
            for (var i = 0; i < n; i++) {
                V.w[i] = this.w[i];
            }
            return V;
        },
        addFrom: function(V) {
            for (var k = 0; k < this.w.length; k++) {
                this.w[k] += V.w[k];
            }
        },
        addFromScaled: function(V, a) {
            for (var k = 0; k < this.w.length; k++) {
                this.w[k] += a * V.w[k];
            }
        },
        setConst: function(a) {
            for (var k = 0; k < this.w.length; k++) {
                this.w[k] = a;
            }
        },
    }

    global.Vol = Vol;
})(net_lib);

//FullyConn
(function(global) {
    "use strict";
    var Vol = global.Vol; // convenience

    // This file contains all layers that do dot products with input,
    // but usually in a different connectivity pattern and weight sharing
    // schemes:
    // - FullyConn is fully connected dot products
    var FullyConnLayer = function(opt) {
        var opt = opt || {};
        this.weights_frozen = false;
        this.biases_frozen = false;
        // required
        // ok fine we will allow 'filters' as the word as well
        this.out_depth = typeof opt.num_neurons !== 'undefined'
            ? opt.num_neurons
            : opt.filters;

        // optional
        this.l1_decay_mul = typeof opt.l1_decay_mul !== 'undefined'
            ? opt.l1_decay_mul
            : 0.0;
        this.l2_decay_mul = typeof opt.l2_decay_mul !== 'undefined'
            ? opt.l2_decay_mul
            : 1.0;

        // computed
        this.num_inputs = opt.in_sx * opt.in_sy * opt.in_depth;
        this.out_sx = 1;
        this.out_sy = 1;
        this.layer_type = 'fc';

        // initializations
        var bias = typeof opt.bias_pref !== 'undefined'
            ? opt.bias_pref
            : 0.0;
        this.filters = new Array(this.out_depth);
        for (var i = 0; i < this.out_depth; i++) {
            this.filters[i] = new Vol(1, 1, this.num_inputs);
        }
        this.biases = new Vol(1, 1, this.out_depth, bias);
    }

    FullyConnLayer.prototype = {
        forward: function(V, is_training) {
            this.in_act = V;
            var A = new Vol(1, 1, this.out_depth, 0.0);
            var Vw = V.w;
            for (var i = 0; i < this.out_depth; i++) {
                var a = 0.0;
                var wi = this.filters[i].w;
                for (var d = 0; d < this.num_inputs; d++) {
                    a += Vw[d] * wi[d]; // for efficiency use Vols directly for now
                }
                a += this.biases.w[i];
                A.w[i] = a;
            }
            this.out_act = A;
            return this.out_act;
        },
        backward: function() {
            var V = this.in_act;
            global.setZero(V.dw);

            // compute gradient wrt weights and data
            for (var i = 0; i < this.out_depth; i++) {
                var tfi = this.filters[i];
                var chain_grad = this.out_act.dw[i];
                for (var d = 0; d < this.num_inputs; d++) {
                    V.dw[d] += tfi.w[d] * chain_grad; // grad wrt input data
                    tfi.dw[d] += V.w[d] * chain_grad; // grad wrt params
                }
                this.biases.dw[i] += chain_grad;
            }
        },
        getParamsAndGrads: function() {
            var response = [];
            if (!this.weights_frozen) {
                for (var i = 0; i < this.out_depth; i++) {
                    response.push({params: this.filters[i].w, grads: this.filters[i].dw, l1_decay_mul: this.l1_decay_mul, l2_decay_mul: this.l2_decay_mul});
                }
            }
            if (!this.biases_frozen) {
                response.push({params: this.biases.w, grads: this.biases.dw, l1_decay_mul: 0.0, l2_decay_mul: 0.0});
            }
            return response;
        },
        freeze_weights: function() {
            this.weights_frozen = true;
        },
        freeze_biases: function() {
            this.biases_frozen = true;
        },
        setWeights: function(w_list) {
            for (var i = 0; i < this.filters.length; i++) {
                this.filters[i].w = w_list[i];
            }
        },
        setBiases: function(b_list) {
            this.biases.w = b_list;
        },
    }

    global.FullyConnLayer = FullyConnLayer;

})(net_lib);

//Variational
(function(global) {
    "use strict";
    var Vol = global.Vol; // convenience

    var VariationalLayer = function(opt) {
        var opt = opt || {};
        this.weights_frozen = false;
        this.biases_frozen = false;
        // required
        // ok fine we will allow 'filters' as the word as well
        this.out_depth = typeof opt.num_neurons !== 'undefined'
            ? opt.num_neurons
            : opt.filters;

        // computed
        this.num_inputs = opt.in_sx * opt.in_sy * opt.in_depth;
        this.out_sx = 1;
        this.out_sy = 1;
        this.layer_type = 'variational';
        this.alpha = typeof opt.alpha !== 'undefined' ? opt.alpha : 1e-2;

        // initializations
        this.mu = new Array(this.out_depth);
        this.sigma = new Array(this.out_depth);
        this.sampled_epsilon = new Array(this.out_depth);
        this.sampled_w = new Array(this.out_depth);
        for (var i = 0; i < this.out_depth; i++) {
            this.mu[i] = new Vol(1, 1, this.num_inputs);
            this.sigma[i] = new Vol(1, 1, this.num_inputs, 0.3);
            this.sampled_epsilon[i] = new Vol(1, 1, this.num_inputs);
            this.sampled_w[i] = new Vol(1, 1, this.num_inputs);
        }

        this.biases = new Vol(1, 1, this.out_depth);
    }

    VariationalLayer.prototype = {
        forward: function(V, is_training) {
            this.in_act = V;
            var A = new Vol(1, 1, this.out_depth, 0.0);

            //if training, use sampled vals, else just use mean to evaluate
            if (is_training) {
                this.sample();
                var Vw = V.w;
                for (var i = 0; i < this.out_depth; i++) {
                    var a = 0.0;
                    var wi = this.sampled_w[i].w;
                    for (var d = 0; d < this.num_inputs; d++) {
                        a += Vw[d] * wi[d]; // for efficiency use Vols directly for now
                    }
                    a += this.biases.w[i];
                    A.w[i] = a;
                }
                this.out_act = A;
                return this.out_act;
            } else {
                var Vw = V.w;
                for (var i = 0; i < this.out_depth; i++) {
                    var a = 0.0;
                    var wi = this.mu[i].w;
                    for (var d = 0; d < this.num_inputs; d++) {
                        a += Vw[d] * wi[d]; // for efficiency use Vols directly for now
                    }
                    a += this.biases.w[i];
                    A.w[i] = a;
                }
                this.out_act = A;
                return this.out_act;
            }
        },
        seededForward: function(V, seed) {
            var A = new Vol(1, 1, this.out_depth, 0);
            var Vw = V.w;
            for (var i = 0; i < this.out_depth; i++) {
                var a = 0.0;
                for (var d = 0; d < this.num_inputs; d++) {
                    a += Vw[d] * (seed[i * this.num_inputs + d] * this.sigma[i].w[d] + this.mu[i].w[d]);
                }
                a += this.biases.w[i];
                A.w[i] = a;
            }
            return A;
        },
        backward: function() {
            var V = this.in_act;
            global.setZero(V.dw);
            for (var i = 0; i < this.out_depth; i++) {
                var tfi = this.sampled_w[i];
                var chain_grad = this.out_act.dw[i];
                for (var d = 0; d < this.num_inputs; d++) {
                    V.dw[d] += tfi.w[d] * chain_grad; // grad wrt input data
                    tfi.dw[d] = V.w[d] * chain_grad; // grad wrt params
                }
                this.biases.dw[i] += chain_grad;
            }
            for (var j = 0; j < this.sampled_w.length; j++) {
                for (var k = 0; k < this.sampled_w[j].dw.length; k++) {
                    this.mu[j].dw[k] += this.sampled_w[j].dw[k];
                    this.sigma[j].dw[k] += -this.alpha / this.sigma[j].w[k] + (this.sampled_w[j].dw[k] * this.sampled_epsilon[j].w[k]);
                }
            }
        },
        sample: function() {
            //sample a set of weights
            for (var i = 0; i < this.sampled_w.length; i++) {
                for (var j = 0; j < this.sampled_w[i].w.length; j++) {
                    this.sampled_epsilon[i].w[j] = global.randn(0, 0);
                    this.sampled_w[i].w[j] = this.sampled_epsilon[i].w[j] * this.sigma[i].w[j] + this.mu[i].w[j];
                }
            }
        },
        getParamsAndGrads: function() {
            var response = [];
            for (var i = 0; i < this.out_depth; i++) {
                response.push({params: this.mu[i].w, grads: this.mu[i].dw, l1_decay_mul: 0.0, l2_decay_mul: 0.0});
            }
            for (var j = 0; j < this.out_depth; j++) {
                response.push({params: this.sigma[j].w, grads: this.sigma[j].dw, l1_decay_mul: 0.0, l2_decay_mul: 0.0});
            }
            if (!this.biases_frozen) {
                response.push({params: this.biases.w, grads: this.biases.dw, l1_decay_mul: 0.0, l2_decay_mul: 0.0});
            }
            return response;
        },
        freeze_weights: function() {
            this.weights_frozen = true;
        },
        freeze_biases: function() {
            this.biases_frozen = true;
        },
        setMeans: function(mean_list) {
            for (var i = 0; i < this.mu.length; i++) {
                this.mu[i].w = mean_list[i];
            }
        },
        setBiases: function(b_list) {
            this.biases.w = b_list;
        },
        setStds: function(std_list) {
            for (var i = 0; i < this.std.length; i++) {
                this.sigma[i].w = std_list[i];
            }
        },
    }

    global.VariationalLayer = VariationalLayer;

})(net_lib);

//Input
(function(global) {
    "use strict";
    var Vol = global.Vol; // convenience
    var getopt = global.getopt;

    var InputLayer = function(opt) {
        var opt = opt || {};

        // required: depth
        this.out_depth = getopt(opt, [
            'out_depth', 'depth'
        ], 0);

        // optional: default these dimensions to 1
        this.out_sx = getopt(opt, [
            'out_sx', 'sx', 'width'
        ], 1);
        this.out_sy = getopt(opt, [
            'out_sy', 'sy', 'height'
        ], 1);

        // computed
        this.layer_type = 'input';
    }
    InputLayer.prototype = {
        forward: function(V, is_training) {
            this.in_act = V;
            this.out_act = V;
            return this.out_act; // simply identity function for now
        },
        backward: function() {},
        getParamsAndGrads: function() {
            return [];
        },
    }

    global.InputLayer = InputLayer;
})(net_lib);

//Softmax, Regression
(function(global) {
    "use strict";
    var Vol = global.Vol; // convenience

    // Layers that implement a loss. Currently these are the layers that
    // can initiate a backward() pass. In future we probably want a more
    // flexible system that can accomodate multiple losses to do multi-task
    // learning, and stuff like that. But for now, one of the layers in this
    // file must be the final layer in a Net.

    // This is a classifier, with N discrete classes from 0 to N-1
    // it gets a stream of N incoming numbers and computes the softmax
    // function (exponentiate and normalize to sum to 1 as probabilities should)
    var SoftmaxLayer = function(opt) {
        var opt = opt || {};

        // computed
        this.num_inputs = opt.in_sx * opt.in_sy * opt.in_depth;
        this.out_depth = this.num_inputs;
        this.out_sx = 1;
        this.out_sy = 1;
        this.layer_type = 'softmax';
    }

    SoftmaxLayer.prototype = {
        forward: function(V, is_training) {
            this.in_act = V;

            var A = new Vol(1, 1, this.out_depth, 0.0);

            // compute max activation
            var as = V.w;
            var amax = V.w[0];
            for (var i = 1; i < this.out_depth; i++) {
                if (as[i] > amax)
                    amax = as[i];
                }

            // compute exponentials (carefully to not blow up)
            var es = global.zeros(this.out_depth);
            var esum = 0.0;
            for (var i = 0; i < this.out_depth; i++) {
                var e = Math.exp(as[i] - amax);
                esum += e;
                es[i] = e;
            }

            // normalize and output to sum to one
            for (var i = 0; i < this.out_depth; i++) {
                es[i] /= esum;
                A.w[i] = es[i];
            }

            this.es = es; // save these for backprop
            this.out_act = A;
            return this.out_act;
        },
        backward: function(y) {

            // compute and accumulate gradient wrt weights and bias of this layer
            var x = this.in_act;
            x.dw = global.zeros(x.w.length); // zero out the gradient of input Vol

            for (var i = 0; i < this.out_depth; i++) {
                var indicator = i === y
                    ? 1.0
                    : 0.0;
                var mul = -(indicator - this.es[i]);
                x.dw[i] = mul;
            }

            // loss is the class negative log likelihood
            return -Math.log(this.es[y]);
        },
        getParamsAndGrads: function() {
            return [];
        },
    }

    // implements an L2 regression cost layer,
    // so penalizes \sum_i(||x_i - y_i||^2), where x is its input
    // and y is the user-provided array of "correct" values.
    var RegressionLayer = function(opt) {
        var opt = opt || {};
        // computed
        this.num_inputs = opt.in_sx * opt.in_sy * opt.in_depth;
        this.out_depth = this.num_inputs;
        this.out_sx = 1;
        this.out_sy = 1;
        this.layer_type = 'regression';
    }

    RegressionLayer.prototype = {
        forward: function(V, is_training) {
            this.in_act = V;
            this.out_act = V;
            return V; // identity function
        },
        // y is a list here of size num_inputs
        // or it can be a number if only one value is regressed
        // or it can be a struct {dim: i, val: x} where we only want to
        // regress on dimension i and asking it to have value x
        backward: function(y) {
            // compute and accumulate gradient wrt weights and bias of this layer
            var x = this.in_act;
            global.setZero(x.dw);
            var dy = x.w[0] - y;
            x.dw[0] = dy;
            return 0.5 * dy * dy;
        },
        getParamsAndGrads: function() {
            return [];
        },
    }
    global.SoftmaxLayer = SoftmaxLayer;
    global.RegressionLayer = RegressionLayer;
})(net_lib);

//Relu, Tanh, rbf
(function(global) {
    "use strict";
    var Vol = global.Vol; // convenience

    // Implements ReLU nonlinearity elementwise
    // x -> max(0, x)
    // the output is in [0, inf)
    var ReluLayer = function(opt) {
        var opt = opt || {};

        // computed
        this.out_sx = opt.in_sx;
        this.out_sy = opt.in_sy;
        this.out_depth = opt.in_depth;
        this.layer_type = 'relu';
    }
    ReluLayer.prototype = {
        forward: function(V, is_training) {
            this.in_act = V;
            var V2 = V.clone();
            var N = V.w.length;
            var V2w = V2.w;
            for (var i = 0; i < N; i++) {
                if (V2w[i] < 0)
                    V2w[i] = 0; // threshold at 0
                }
            this.out_act = V2;
            return this.out_act;
        },
        backward: function() {
            var V = this.in_act; // we need to set dw of this
            var V2 = this.out_act;
            var N = V.w.length;
            global.setZero(V.dw); // zero out gradient wrt data
            for (var i = 0; i < N; i++) {
                if (V2.w[i] <= 0)
                    V.dw[i] = 0; // threshold
                else
                    V.dw[i] = V2.dw[i];
            }
        },
        getParamsAndGrads: function() {
            return [];
        },
    }

    var RbfLayer = function(opt) {
        var opt = opt || {};
        // computed
        this.out_sx = opt.in_sx;
        this.out_sy = opt.in_sy;
        this.out_depth = opt.in_depth;
        this.layer_type = 'rbf';
    }
    RbfLayer.prototype = {
        forward: function(V, is_training) {
            this.in_act = V;
            var V2 = V.cloneAndZero();
            V2.w = V.w.map((x) => {
                return Math.exp(-Math.pow(x, 2))
            });
            this.out_act = V2;
            return this.out_act;
        },
        backward: function() {
            var V = this.in_act; // we need to set dw of this
            var V2 = this.out_act;
            var N = V.w.length;
            global.setZero(V.dw);
            for (var i = 0; i < N; i++) {
                var vwi = V.w[i];
                var v2wi = V2.w[i];
                V.dw[i] = -2 * vwi * v2wi * V2.dw[i];
            }
        },
        getParamsAndGrads: function() {
            return [];
        },
    }

    // a helper function, since tanh is not yet part of ECMAScript. Will be in v6.
    function tanh(x) {
        var y = Math.exp(2 * x);
        return (y - 1) / (y + 1);
    }
    // Implements Tanh nnonlinearity elementwise
    // x -> tanh(x)
    // so the output is between -1 and 1.
    var TanhLayer = function(opt) {
        var opt = opt || {};
        // computed
        this.out_sx = opt.in_sx;
        this.out_sy = opt.in_sy;
        this.out_depth = opt.in_depth;
        this.layer_type = 'tanh';
    }
    TanhLayer.prototype = {
        forward: function(V, is_training) {
            this.in_act = V;
            var V2 = V.cloneAndZero();
            var N = V.w.length;
            for (var i = 0; i < N; i++) {
                V2.w[i] = tanh(V.w[i]);
            }
            this.out_act = V2;
            return this.out_act;
        },
        backward: function() {
            var V = this.in_act; // we need to set dw of this
            var V2 = this.out_act;
            var N = V.w.length;
            global.setZero(V.dw); // zero out gradient wrt data
            for (var i = 0; i < N; i++) {
                var v2wi = V2.w[i];
                V.dw[i] = (1.0 - v2wi * v2wi) * V2.dw[i];
            }
        },
        getParamsAndGrads: function() {
            return [];
        },
    }

    global.TanhLayer = TanhLayer;
    global.RbfLayer = RbfLayer;
    global.ReluLayer = ReluLayer;
})(net_lib);

//Net
(function(global) {
    "use strict";
    var Vol = global.Vol; // convenience
    var assert = global.assert;

    // Net manages a set of layers
    // For now constraints: Simple linear order of layers, first layer input last layer a cost layer
    var Net = function(options) {
        this.layers = [];
    }

    Net.prototype = {

        // takes a list of layer definitions and creates the network layer objects
        makeLayers: function(defs) {

            // few checks
            assert(defs.length >= 2, 'Error! At least one input layer and one loss layer are required.');
            assert(defs[0].type === 'input', 'Error! First layer must be the input layer, to declare size of inputs');

            // desugar layer_defs for adding activation, dropout layers etc
            var desugar = function() {
                var new_defs = [];
                for (var i = 0; i < defs.length; i++) {
                    var def = defs[i];

                    if (def.type === 'softmax' || def.type === 'svm') {
                        // add an fc layer here, there is no reason the user should
                        // have to worry about this and we almost always want to
                        new_defs.push({type: 'fc', num_neurons: def.num_classes});
                    }

                    if (def.type === 'regression') {
                        // add an fc layer here, there is no reason the user should
                        // have to worry about this and we almost always want to
                        new_defs.push({type: 'fc', num_neurons: def.num_neurons});
                    }

                    if (def.type === 'vregression') {
                        new_defs.push({type: 'variational', num_neurons: def.num_neurons});
                    }

                    if ((def.type === 'fc' || def.type === 'conv') && typeof(def.bias_pref) === 'undefined') {
                        def.bias_pref = 0.0;
                        if (typeof def.activation !== 'undefined' && def.activation === 'relu') {
                            def.bias_pref = 0.1; // relus like a bit of positive bias to get gradients early
                            // otherwise it's technically possible that a relu unit will never turn on (by chance)
                            // and will never get any gradient and never contribute any computation. Dead relu.
                        }
                    }

                    new_defs.push(def);

                    if (typeof def.activation !== 'undefined') {
                        if (def.activation === 'relu') {
                            new_defs.push({type: 'relu'});
                        } else if (def.activation === 'tanh') {
                            new_defs.push({type: 'tanh'});
                        } else if (def.activation === 'rbf') {
                            new_defs.push({type: 'rbf'});
                        } else {
                            console.log('ERROR unsupported activation ' + def.activation);
                        }
                    }
                }
                return new_defs;
            }
            defs = desugar(defs);

            // create the layers
            this.layers = [];
            for (var i = 0; i < defs.length; i++) {
                var def = defs[i];
                if (i > 0) {
                    var prev = this.layers[i - 1];
                    def.in_sx = prev.out_sx;
                    def.in_sy = prev.out_sy;
                    def.in_depth = prev.out_depth;
                }

                switch (def.type) {
                    case 'fc':
                        this.layers.push(new global.FullyConnLayer(def));
                        break;
                    case 'input':
                        this.layers.push(new global.InputLayer(def));
                        break;
                    case 'softmax':
                        this.layers.push(new global.SoftmaxLayer(def));
                        break;
                    case 'regression':
                        this.layers.push(new global.RegressionLayer(def));
                        break;
                    case 'vregression':
                        this.layers.push(new global.RegressionLayer(def));
                        break;
                    case 'variational':
                        this.layers.push(new global.VariationalLayer(def));
                        break;
                    case 'relu':
                        this.layers.push(new global.ReluLayer(def));
                        break;
                    case 'tanh':
                        this.layers.push(new global.TanhLayer(def));
                        break;
                    case 'rbf':
                        this.layers.push(new global.RbfLayer(def));
                        break;
                    default:
                        console.log('ERROR: UNRECOGNIZED LAYER TYPE: ' + def.type);
                }
            }
        },

        // forward prop the network.
        // The trainer class passes is_training = true, but when this function is
        // called from outside (not from the trainer), it defaults to prediction mode
        forward: function(V, is_training) {
            if (typeof(is_training) === 'undefined')
                is_training = false;
            var act = this.layers[0].forward(V, is_training);
            for (var i = 1; i < this.layers.length; i++) {
                act = this.layers[i].forward(act, is_training);
            }
            return act;
        },
        variationalForward: function(V, seeds) {
            var acts = [];
            for (var i = 0; i < seeds.length; i++) {
                var slice_idx = 0;
                var act = this.layers[0].forward(V, false);
                for (var j = 1; j < this.layers.length; j++) {
                    if (this.layers[j].layer_type === 'variational') {
                        var num_weights = this.layers[j].mu.length * this.layers[j].mu[0].w.length;
                        act = this.layers[j].seededForward(act, seeds[i].slice(slice_idx, slice_idx + num_weights));
                        slice_idx += num_weights;
                    } else {
                        act = this.layers[j].forward(act, false);
                    }
                }
                acts.push(act);
            }
            return acts;
        },
        getCostLoss: function(V, y) {
            this.forward(V, false);
            var N = this.layers.length;
            var loss = this.layers[N - 1].backward(y);
            return loss;
        },
        // backprop: compute gradients wrt all parameters
        backward: function(y) {
            var N = this.layers.length;
            var loss = this.layers[N - 1].backward(y); // last layer assumed to be loss layer
            for (var i = N - 2; i >= 0; i--) { // first layer assumed input
                this.layers[i].backward();
            }
            return loss;
        },
        getParamsAndGrads: function() {
            // accumulate parameters and gradients for the entire network
            var response = [];
            for (var i = 0; i < this.layers.length; i++) {
                var layer_response = this.layers[i].getParamsAndGrads();
                for (var j = 0; j < layer_response.length; j++) {
                    response.push(layer_response[j]);
                }
            }
            return response;
        },
        getPrediction: function() {
            // this is a convenience function for returning the argmax
            // prediction, assuming the last layer of the net is a softmax
            var S = this.layers[this.layers.length - 1];
            assert(S.layer_type === 'softmax', 'getPrediction function assumes softmax as last layer of the net!');

            var p = S.out_act.w;
            var maxv = p[0];
            var maxi = 0;
            for (var i = 1; i < p.length; i++) {
                if (p[i] > maxv) {
                    maxv = p[i];
                    maxi = i;
                }
            }
            return maxi; // return index of the class with highest class probability
        },
        freezeAllButLayer: function(x) {
            //only allow weights to change
            this.layers[x].freeze_biases();
            var layer;
            for (var i = 0; i < this.layers.length; i++) {
                if (i != x) {
                    layer = this.layers[i];
                    if (layer.layer_type === 'fc' || layer.layer_type === 'variational') {
                        layer.freeze_weights();
                        layer.freeze_biases();
                    }
                }
            }
        },
        getLayer: function(index) {
            return this.layers[index];
        },
    }

    global.Net = Net;
})(net_lib);

//Trainer
(function(global) {
    "use strict";
    var Vol = global.Vol; // convenience

    var Trainer = function(net, options) {
        this.net = net;

        var options = options || {};
        this.learning_rate = typeof options.learning_rate !== 'undefined'
            ? options.learning_rate
            : params.learning_rate;
        this.l1_decay = typeof options.l1_decay !== 'undefined'
            ? options.l1_decay
            : 0.0;
        this.l2_decay = typeof options.l2_decay !== 'undefined'
            ? options.l2_decay
            : 0.0;
        this.batch_size = typeof options.batch_size !== 'undefined'
            ? options.batch_size
            : 1;
        this.momentum = typeof options.momentum !== 'undefined'
            ? options.momentum
            : params.momentum;
        this.iter = 0; // iteration counter
        this.gsum = []; // last iteration gradients for momentum
    }

    Trainer.prototype = {
        train: function(x, y) {
            this.net.forward(x, true); //is_training = true
            var cost_loss = this.net.backward(y);
            var l2_decay_loss = 0.0;
            var l1_decay_loss = 0.0;

            this.iter++;

            // apply grad update
            if (this.iter % this.batch_size === 0) {
                var pglist = this.net.getParamsAndGrads();
                if (this.gsum.length === 0 && this.momentum > 0.0) {
                    // only vanilla sgd doesnt need either lists
                    for (var i = 0; i < pglist.length; i++) {
                        this.gsum.push(global.zeros(pglist[i].params.length));
                    }
                }

                // perform an update for all sets of weights
                for (var i = 0; i < pglist.length; i++) {
                    var pg = pglist[i]; // param, gradient, other options in future (custom learning rate etc)
                    var p = pg.params;
                    var g = pg.grads;

                    // learning rate for some parameters.
                    var l2_decay_mul = typeof pg.l2_decay_mul !== 'undefined'
                        ? pg.l2_decay_mul
                        : 1.0;
                    var l1_decay_mul = typeof pg.l1_decay_mul !== 'undefined'
                        ? pg.l1_decay_mul
                        : 1.0;
                    var l2_decay = this.l2_decay * l2_decay_mul;
                    var l1_decay = this.l1_decay * l1_decay_mul;

                    var plen = p.length;
                    for (var j = 0; j < plen; j++) {
                        l2_decay_loss += l2_decay * p[j] * p[j] / 2; // accumulate weight decay loss
                        l1_decay_loss += l1_decay * Math.abs(p[j]);
                        var l1grad = l1_decay * (
                            p[j] > 0
                            ? 1
                            : -1);
                        var l2grad = l2_decay * (p[j]);

                        var gij = (l2grad + l1grad + g[j]) / this.batch_size;

                         // raw batch gradient
                        var gsumi = this.gsum[i];

                        // assume SGD
                        if (this.momentum > 0.0) {
                            // momentum update
                            var dx = this.momentum * gsumi[j] - this.learning_rate * gij; // step
                            gsumi[j] = dx; // back this up for next iteration of momentum
                            p[j] += dx; // apply corrected gradient
                        } else {
                            // vanilla sgd
                            p[j] += -this.learning_rate * gij;
                        }

                        g[j] = 0.0; // zero out gradient so that we can begin accumulating anew
                    }
                }
            }

            // in future, TODO: have to completely redo the way loss is done around the network as currently
            // loss is a bit of a hack. Ideally, user should specify arbitrary number of loss functions on any layer
            // and it should all be computed correctly and automatically.
            return {
                cost_loss: cost_loss,
                loss: cost_loss + l1_decay_loss + l2_decay_loss
            }
        }
    }

    global.Trainer = Trainer;
})(net_lib);
