function rw(curve_div, use_validation_data) {

    this.div_id = curve_div.attr('id');
    var shape = tf.tensor([1, 10, 10, 1], [4], 'int32');
    var last_loss = 0;

    this.start = function() {
        if (!walk_timer) {
            sample();
            plot();
            walk_timer = d3.timer(sample, 25);
            plot_timer = d3.timer(plot, 25);
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

    var predictions = new Array(curve_x_extended.length);
    var proposal_pred = new Array(curve_x_extended.length);
    var walk_timer;
    var plot_timer;

    var bucket_row = 40;
    var bucket_col = 100;
    var bucket_col_count = Array.from({
        length: bucket_col
    }, (x, n) => 1);
    var buckets = new Array(bucket_row);
    for (var i = 0; i < bucket_row; i++) {
        buckets[i] = new Array(bucket_col);
        for (var j = 0; j < bucket_col; j++) {
            buckets[i][j] = 0;
        }
    }
    var num_samples = 0;
    var bucket_col_scale = d3.scaleLinear().domain([0, curve_x_extended.length]).range([
        0, bucket_col - 1
    ]);
    bucket_col_scale.clamp(true);
    var bucket_row_scale = d3.scaleLinear().domain(param.curve_domain_y).range([
        bucket_row - 1,
        0
    ]);
    bucket_row_scale.clamp(true);

    var bucket_color = d3.scaleLinear().domain([
        0, 2 / bucket_row
    ]).interpolate(function() {
        return d3.interpolateGreys;
    });
    var bucket_scale = d3.contours().size([
        bucket_col - 1,
        bucket_row - 2
    ]).thresholds(d3.range(-0.5, 0.01, 0.005));

    initial_plot();

    var initial_sample = {
<<<<<<< HEAD
		biases: tf.variable(tf.randomNormal(shape.slice([1]).sum().flatten())),
		weights: tf.variable(tf.randomNormal(shape.slice([0], [shape.shape[0] - 1]).mul(shape.slice([1])).sum().flatten())),
=======
		biases: tf.randomNormal(shape.slice([1]).sum().flatten().dataSync()),
		weights: tf.randomNormal(shape.slice([0], [shape.shape[0] - 1]).mul(shape.slice([1])).sum().flatten().dataSync()),
>>>>>>> new tfjs rw, need to fix perf
	}
	var last_sample = initial_sample;
    predictions = curve_x_extended.map(x => { return forward(initial_sample, tf.tanh, x); });

    function initial_plot() {
        curve_plotter.add_group("sq");
        curve_plotter.add_group("lastproposal");
        curve_plotter.add_group("lastsample");
        curve_plotter.add_group("fixed");
        plot_training_data();
        plot_buckets();
    }

    function sample() {
        var std = Math.log(0.05);
        var new_sample = propose(last_sample, std);

        // accept or reject
        proposal_pred = curve_x_extended.map(x => { return forward(new_sample, tf.tanh, x); });
        var transition_prob = Math.min(1, Math.exp(training_loss(last_sample, tf.tanh) - training_loss(new_sample, tf.tanh)));

        if (Math.random() <= transition_prob) {
            // accept
			predictions = curve_x_extended.map(x => { return forward(new_sample, tf.tanh, x); });
			last_sample = new_sample;
        } else {
			predictions = curve_x_extended.map(x => { return forward(last_sample, tf.tanh, x); });
		}

        for (var i = 0; i < predictions.length; i++) {
            buckets[Math.floor(bucket_row_scale(predictions[i]))][Math.floor(bucket_col_scale(i))]++;
            bucket_col_count[Math.floor(bucket_col_scale(i))]++;
        }

        num_samples++;
    }

    function propose(sample_t, std) {
        return {
            weights: sample_t.weights.add(tf.randomNormal(sample_t.weights.shape).mul(tf.tensor(std))),
            biases: sample_t.biases.add(tf.randomNormal(sample_t.biases.shape).mul(tf.tensor(std)))
        }
    }

	function forward(sample_t, activation, input) {
		var unpacked = unpack_sample(sample_t);
		var output = tf.tensor([input]).reshape([1,1]);
        for (var i = 0; i < unpacked.weights.length; i++) {
            output = activation(unpacked.weights[i].matMul(output)).add(unpacked.biases[i]);
        }
		return output.dataSync();
	}

	function training_loss(sample_t, activation) {
		return train_xs.map((x,i) => {
			return loss(sample_t, activation, x, train_ys[i])
		}).reduce((a, b) => a + b, 0);
	}

    function loss(sample_t, activation, input, labels) {
		var output = forward(sample_t, activation, input);
		return tf.losses.meanSquaredError(tf.tensor(output).reshape([1,1]), tf.tensor(labels).reshape([1,1])).dataSync()[0];
    }

    function unpack_sample(sample) {
        var w_ind = 0;
        var b_ind = 0;
        var unpacked = {
            weights: [],
            biases: []
        };
		var size_arr = shape.dataSync();
        for (var i = 0; i < shape.shape[0] - 1; i++) {
            unpacked.weights.push(sample.weights.slice([w_ind], [size_arr[i] * size_arr[i + 1]]).reshape([size_arr[i + 1], size_arr[i]]));
            unpacked.biases.push(sample.biases.slice([b_ind], [size_arr[i + 1]]).reshape([size_arr[i + 1], 1]));
			w_ind += size_arr[i] * size_arr[i + 1];
			b_ind += size_arr[i + 1];
        }
        return unpacked;
    }

    function plot() {
        console.log(last_loss);
<<<<<<< HEAD
        var proposal_pts = curve_x_extended.map((x, n) => {
            return {x: x, y: proposal_pred[n]}
        });
        var pts = curve_x_extended.map((x, n) => {
            return {x: x, y: predictions[n]}
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
=======
        // var proposal_pts = curve_x_extended.map((x, n) => {
        //     return {x: x, y: proposal_pred[n]}
        // });
        // var pts = curve_x_extended.map((x, n) => {
        //     return {x: x, y: predictions[n]}
        // });
        // curve_plotter.plot_path([pts], {
        //     color: "green",
        //     width: 2,
        //     opacity: 1,
        //     id: "#lastsample"
        // });
        // curve_plotter.plot_path([proposal_pts], {
        //     color: "red",
        //     width: 2,
        //     opacity: 1,
        //     id: "#lastproposal"
        // });

        // plot_buckets();
>>>>>>> new tfjs rw, need to fix perf
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

<<<<<<< HEAD
=======
    function make_preset_net() {
        var layer_defs = new Array(4);
        layer_defs[0] = {
            type: 'input',
            out_sx: 1,
            out_sy: 1,
            out_depth: 1
        };
        layer_defs[1] = {
            type: 'fc',
            num_neurons: 10,
            activation: 'rbf'
        };
        layer_defs[2] = {
            type: 'fc',
            num_neurons: 10,
            activation: 'rbf'
        };
        layer_defs[3] = {
            type: 'regression',
            num_neurons: 1
        };
        var new_net = new net_lib.Net();
        new_net.makeLayers(layer_defs);
        return new_net;
    }

>>>>>>> new tfjs rw, need to fix perf
    function plot_training_data() {
        var pts = use_validation_data
            ? validation_points_data
            : training_points_data;
        curve_plotter.plot_points(pts, {
            stroke: "black",
            color: "orange",
            size: 4,
            opacity: 1,
            id: "#fixed"
        });
    }
}
