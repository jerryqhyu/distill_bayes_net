function hmc_view(curve_div) {

	var curve_plotter = Plotter(curve_div, param.curve_domain_x, param.curve_domain_y,
		false, false);
	var samples = [];
	var predictions = []; // for speed we store predictions and only append last
	var p_length = [];
	var steps = 30;
	var timer;

	initial_plot();

	function initial_plot() {
		curve_plotter.add_group("float");
		curve_plotter.add_group("fixed");
		plot_training_data();
	}

	function start() {
		var first_net = make_preset_net();
		samples.push(unpack_net(first_net));
		for (var i = -5; i <= 5; i += param.step_size) {
			predictions.push([first_net.forward(new net_lib.Vol([i])).w[0]]);
		}
		if (!timer) {
			timer = d3.timer(sample, 50);
		}
	}

	function reset() {
		samples = [];
		curve_plotter.svg.select("#float").selectAll("*").remove();
		clear();
		plot();
	}

	function clear() {
		curve_plotter.svg.select("#float").selectAll("*").remove();
	}

	function sample() {
		var last_sample = samples[samples.length - 1];

		// gaussian proposal
		var new_sample = propose(last_sample, steps, param.learning_rate / 2);

		// accept or reject
		var last_net = pack_net(last_sample);
		var new_net = pack_net(new_sample.p);

		var idx = 0;
		var transition_prob = Math.min(1, Math.exp((training_loss(new_net) - new_sample.normp/2) - (training_loss(last_net) - new_sample.normp0/2)));

		var pts = [];
		if (Math.random() <= transition_prob) {
			// accept
			samples.push(new_sample.p);
			for (var i = -5; i <= 5; i += param.step_size) {
				predictions[idx].push(new_net.forward(new net_lib.Vol([i])).w[0]);
				pts.push({x: i, y: new_net.forward(new net_lib.Vol([i])).w[0]});
				idx++;
	        }
		} else {
			samples.push(last_sample);
			for (var i = -5; i <= 5; i += param.step_size) {
				predictions[idx].push(last_net.forward(new net_lib.Vol([i])).w[0]);
				pts.push({x: i, y: last_net.forward(new net_lib.Vol([i])).w[0]});
				idx++;
			}
		}

		clear();
		plot_sample_dist();
		curve_plotter.plot_path(pts, {
			color: "black",
			width: 2,
			opacity: 1,
			id: "#float"
		});
	}

	function propose(sample_t, step_count, step_size) {
		// gaussian init for p0
		var gaussian_weights = sample_t.weights.map(layer => {
			return layer.map(r => {
				return r.map(c => {
					return net_lib.randn(0, 0);
				});
			});
		});

		var gaussian_biases = sample_t.biases.map(layer => {
			return layer.map(b => {
				return net_lib.randn(0, 0);
			});
		});

		var p = {weights: gaussian_weights, biases: gaussian_biases};
		var q = unpack_net(pack_net(sample_t)); // Deep copy
		var normp0 = norm(p);

		for (var i = 0; i < step_count; i++) {
			p = increment(p, scale(training_grads(q), -param.step_size / 2));
			q = increment(q, scale(p, param.step_size));
			p = increment(p, scale(training_grads(q), -param.step_size / 2));
		}

		return {p: q, normp: norm(p), normp0: normp0}; // scale inversely proportional to magnitude of p?
	}

	function training_grads(weights) {
		var net = pack_net(weights);
		// run through test set to accumulate grads
		for (var i = 0; i < param.train_points.length; i++) {
			net.forward(new net_lib.Vol([param.train_points[i]]), true);
			net.backward([Math.sin(param.train_points[i]) + param.train_noise[i]]);
		}

		return unpack_net_grads(net);
	}

	function increment(x, y) {
		if (x instanceof Array) {
			var r = [];
			for (var i = 0; i < x.length; i++) {
				r.push(increment(x[i], y[i]));
			}
		} else if (x instanceof Object) {
			var r = {};
			r.weights = increment(x.weights, y.weights);
			r.biases = increment(x.biases, y.biases);
		} else {
			var r = x + y;
		}

		return r;
	}

	function scale(x, c) {
		if (x instanceof Array) {
			var r = [];
			for (var i = 0; i < x.length; i++) {
				r.push(scale(x[i], c));
			}
		} else if (x instanceof Object) {
			var r = {};
			r.weights = scale(x.weights, c);
			r.biases = scale(x.biases, c);
		} else {
			// numbers
			var r = x * c;
		}
		return r;
	}

	function norm(x) {
		if (x instanceof Array) {
			return x.map(y => norm(y)).reduce((a, b) => a + b, 0);
		} else if (x instanceof Object) {
			return norm(x.weights) + norm(x.biases);
		} else {
			return Math.pow(x, 2);
		}
	}

	function unpack_net(net) {
		var current_weights = []; // collect weights, avoid objects aliasing
		var current_biases = [];
		net.layers.forEach(layer => {
			if (layer.layer_type === 'fc') {
				var weights = [];
				var biases = [];
				layer.filters.forEach(row => {
					var row_arr = [];
					row.w.forEach(weight => {
						row_arr.push(weight);
					});
					weights.push(row_arr);
				});
				layer.biases.w.forEach(b => {
					biases.push(b);
				});
				current_weights.push(weights);
				current_biases.push(biases);
			}
		});
		return {weights: current_weights, biases: current_biases};
	}

	function unpack_net_grads(net) {
		var current_weights = []; // collect weights, avoid objects aliasing
		var current_biases = [];
		net.layers.forEach(layer => {
			if (layer.layer_type === 'fc') {
				var weights = [];
				var biases = [];
				layer.filters.forEach(row => {
					var row_arr = [];
					row.dw.forEach(weight => {
						row_arr.push(weight);
					});
					weights.push(row_arr);
				});
				layer.biases.dw.forEach(b => {
					biases.push(b);
				});
				current_weights.push(weights);
				current_biases.push(biases);
			}
		});
		return {weights: current_weights, biases: current_biases};
	}

	function pack_net(params) {
		var new_net = make_preset_net();
		var index = 0;
		new_net.layers.forEach(layer => {
			if (layer.layer_type === 'fc') {
				layer.setWeights(params.weights[index]);
				layer.setBiases(params.biases[index]);
				index++;
			}
		});
		return new_net;
	}

	function plot_sample_dist() {
		var percentiles = []; // 10, 25, 45, 55, 75, 90
		for (var i = 0; i < 100; i++) {
			percentiles.push([]);
		}

		// collect percentile for each point
		var idx = 0;
		for (var i = -5; i <= 5; i += param.step_size) {
			single_point_pred = predictions[idx].sort((a, b) => {
                return a - b;
            });

			for (var j = 0; j < percentiles.length; j++) {
                percentiles[j].push({
                    x: i,
                    y: single_point_pred[Math.floor(0.01 * j * (samples.length - 1))]
                });
            }
			idx++;
		}

		// plot the percentile of the samples
		for (var i = 0; i < percentiles.length / 2; i++) {
			curve_plotter.plot_path(percentiles[i].concat(percentiles[percentiles.length -
				1 - i].reverse()), {
				color: "red",
				fill: "red",
				width: 1,
				opacity: 1 / (percentiles.length - 12.5 - i * 1.75),
				id: "#float"
			});
		}
	}

	function training_loss(net) {
		return -1 * param.train_points.map((point, i) => {
			return net.getCostLoss(new net_lib.Vol([point]), Math.sin(point) + param.train_noise[i]);
		}).reduce((a, b) => a + b, 0);
	}

	function make_preset_net() {
		var layer_defs = [];
		layer_defs.push({
			type: 'input',
			out_sx: 1,
			out_sy: 1,
			out_depth: 1
		});
		layer_defs.push({
			type: 'fc',
			num_neurons: 7,
			activation: 'rbf'
		});
		layer_defs.push({
			type: 'fc',
			num_neurons: 7,
			activation: 'rbf'
		});
		layer_defs.push({
			type: 'regression',
			num_neurons: 1
		});
		var new_net = new net_lib.Net();
		new_net.makeLayers(layer_defs);
		return new_net;
	}

	function plot_training_data() {
		training_points_data = param.train_points.map((p, i) => {
			return {
				x: p,
				y: Math.sin(p) + param.train_noise[i]
			}
		});

		curve_plotter.plot_points(training_points_data, {
			stroke: "darkgreen",
			color: "darkgreen",
			size: 4,
			opacity: 1,
			id: "#fixed"
		});
	}

	return {
		start: start,
		reset: reset
	};
}
