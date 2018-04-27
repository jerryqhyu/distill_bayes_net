function randomwalk_view(curve_div, use_validation_data) {

	this.div_id = curve_div.attr('id');

	this.start = function() {
        if (!walk_timer) {
			sample();
			plot();
            walk_timer = d3.timer(sample, 25);
            plot_timer = d3.timer(plot, 200);
        }
    }

    this.stop = function() {
		if (walk_timer) {
			walk_timer.stop();
			plot_timer.stop();
			walk_timer = undefined;
			plot_timer = undefined;
		}
    }

	this.is_running = function () {
		return walk_timer != null;
	}

    var curve_plotter = new Plotter(curve_div, param.curve_domain_x_extended, param.curve_domain_y, false, false);
    var samples = [];
	var predictions = new Array(curve_x_extended.length); // for speed we store predictions and only append last
    var proposal_pred = new Array(curve_x_extended.length);
    var walk_timer;
    var plot_timer;

	var bucket_row = 40;
	var bucket_col = 100;
	var bucket_col_count = Array.from({length: bucket_col}, (x, n) => 1);
	var buckets = new Array(bucket_row);
	for (var i = 0; i < bucket_row; i++) {
		buckets[i] = new Array(bucket_col);
		for (var j = 0; j < bucket_col; j++) {
			buckets[i][j] = 0;
		}
	}
	var num_samples = 0;
	var bucket_col_scale = d3.scaleLinear().domain([0, curve_x_extended.length]).range([0, bucket_col - 1]);
	bucket_col_scale.clamp(true);
    var bucket_row_scale = d3.scaleLinear().domain(param.curve_domain_y).range([bucket_row - 1, 0]);
	bucket_row_scale.clamp(true);

	var bucket_color = d3.scaleLinear().domain([0, 2/bucket_row]).interpolate(function() {
	    return d3.interpolateGreys;
	});
	var bucket_scale = d3.contours().size([bucket_col - 1, bucket_row - 2]).thresholds(d3.range(-0.5, 0.01, 0.005));

    var percentiles = new Array(100); // 1-100
    for (var i = 0; i < 100; i++) {
        percentiles[i] = new Array(curve_x_extended.length);
        for (var j = 0; j < percentiles[i].length; j++) {
            percentiles[i][j] = {
                x: curve_x_extended[j],
                y: 0
            };
        }
    }

    initial_plot();

	var first_net = make_preset_net();
	samples.push(unpack_net(first_net));
	curve_x_extended.forEach((x, n) => {
		predictions[n] = [first_net.forward(new net_lib.Vol([i])).w[0]];
	});

    function initial_plot() {
		curve_plotter.add_group("sq");
        curve_plotter.add_group("percentiles");
		curve_plotter.add_group("lastproposal");
		curve_plotter.add_group("lastsample");
		curve_plotter.add_group("fixed");
        plot_training_data();
		plot_buckets();
    }

    function sample() {
        var std = Math.log(0.05);
        var last_sample = samples[samples.length - 1];

        // gaussian random walk proposal
        var new_sample = propose(last_sample, std);

        // accept or reject
        var last_net = pack_net(last_sample);
        var new_net = pack_net(new_sample);
		curve_x_extended.forEach((x, n) => {
			proposal_pred[n] = new_net.forward(new net_lib.Vol([x])).w[0];
		});

        var idx = 0;
        var transition_prob = Math.min(1, Math.exp(loss(last_net) - loss(new_net)));

        if (Math.random() <= transition_prob) {
            // accept
            samples.push(new_sample);
            curve_x_extended.forEach((x, n) => {
                predictions[n].push(new_net.forward(new net_lib.Vol([x])).w[0]);
            });
        } else {
            samples.push(last_sample);
            curve_x_extended.forEach((x, n) => {
                predictions[n].push(last_net.forward(new net_lib.Vol([x])).w[0]);
            });
        }

		for (var i = 0; i < predictions.length; i++) {
			buckets[Math.floor(bucket_row_scale(predictions[i][num_samples]))][Math.floor(bucket_col_scale(i))]++;
			bucket_col_count[Math.floor(bucket_col_scale(i))]++;
		}

		num_samples++;
    }

    function propose(sample_t, std) {
        var new_weights = sample_t.weights.map(layer => {
            return layer.map(r => {
                return r.map(c => {
                    return c + net_lib.randn(0, std);
                });
            });
        });

        var new_biases = sample_t.biases.map(layer => {
            return layer.map(b => {
                return b + net_lib.randn(0, std);
            });
        });

        return {weights: new_weights, biases: new_biases};
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

    function plot() {
        var proposal_pts = curve_x_extended.map((x, n) => {
            return {x: x, y: proposal_pred[n]}
        });
		var pts = curve_x_extended.map((x, n) => {
            return {x: x, y: predictions[n][predictions[n].length - 1]}
        });
        curve_plotter.plot_path([pts], {
            color: "green",
            width: 2,
            opacity: 1,
            id: "#lastsample"
        });
		curve_plotter.plot_path([proposal_pts], {
			color: "red",
			width: 2,
			opacity: 1,
			id: "#lastproposal"
		});

		plot_buckets();
    }

	function plot_buckets() {
		// -2/-1 to not plot the last row/col
		var data = new Array((bucket_row - 2) * (bucket_col - 1));
		for (var i = 1; i < buckets.length - 1; i++) {
			for (var j = 0; j < buckets[0].length - 1; j++) {
				data[(i - 1) * (buckets[0].length - 1) + j] = -buckets[i][j] / bucket_col_count[j];
			}
		}

		var identity = d3.scaleIdentity();
		curve_plotter.plot_contour(data, {
			n: bucket_col - 1,
			m: bucket_row - 2,
			id: '#sq',
			color_scale: bucket_color,
			contour_scale: bucket_scale
		});
    }

    function loss(net) {
		var pts = use_validation_data ? param.validation_points: param.train_points;
		var noise = use_validation_data ? param.validation_noise: param.train_noise;
        return pts.map((point, i) => {
            return net.getCostLoss(new net_lib.Vol([point]), Math.sin(point) + noise[i]);
        }).reduce((a, b) => a + b, 0);
    }

    function make_preset_net() {
        var layer_defs = new Array(4);
        layer_defs[0] = {type: 'input', out_sx: 1, out_sy: 1, out_depth: 1};
        layer_defs[1] = {type: 'fc', num_neurons: 10, activation: 'rbf'};
        layer_defs[2] = {type: 'fc', num_neurons: 10, activation: 'rbf'};
        layer_defs[3] = {type: 'regression', num_neurons: 1};
        var new_net = new net_lib.Net();
        new_net.makeLayers(layer_defs);
        return new_net;
    }

    function plot_training_data() {
		var pts = use_validation_data ? validation_points_data: training_points_data;
        curve_plotter.plot_points(pts, {
            stroke: "black",
            color: "orange",
            size: 4,
            opacity: 1,
            id: "#fixed"
        });
    }
}
