function hero(curve_div, graph_div) {

    this.div_id = curve_div.attr('id');

    const shape = tf.tensor1d([1, 5, 5, 1], 'int32');
    const w = tf.variable(tf.randomNormal(shape.slice([0], [shape.shape[0] - 1]).mul(shape.slice([1])).sum().flatten().dataSync()));
    const w_v = tf.variable(tf.randomNormal(shape.slice([0], [shape.shape[0] - 1]).mul(shape.slice([1])).sum().flatten().dataSync()));
    const b = tf.variable(tf.randomNormal(shape.slice([1]).sum().flatten().dataSync()));
    const b_v = tf.variable(tf.randomNormal(shape.slice([1]).sum().flatten().dataSync()));

    this.start = function() {
        if (!training_interval) {
            console.log("started training");
            training_interval = d3.timer(train, 50);
            plot_interval = d3.timer(plot, 50);
        }
    }

    this.stop = function() {
        if (training_interval) {
            training_interval.stop();
            plot_interval.stop();
            training_interval = undefined;
            plot_interval = undefined;
        }
    }

    this.is_running = function() {
        return training_interval != null;
    }

    this.reset = function() {

    }

    function predict(x, sample) { 
        return tf.tidy(() => {
            const unpacked = unpack_sample(sample);
            for (var i = 0; i < unpacked.weights.length; i++) {
                x = unpacked.weights[i].matMul(x).elu(0.5).add(unpacked.biases[i]);
            }
            return x;
        });
    }

    var curve_plotter = new Plotter(curve_div, param.curve_domain_x_extended, param.curve_domain_y, false, false);
    var graph_plotter = new Plotter(graph_div, param.nn_domain, param.nn_domain, false, false);

    //define a neural network
    var loss = (pred, label) => pred.sub(label).square().mean();

    //interval controller
    var training_interval;
    var plot_interval;
    setup();

    function train() {
        const optimizer = tf.train.sgd(param.learning_rate);
        for (let iter = 0; iter < train_xs.length; iter++) {
            const noise_w = tf.randomNormal([w_v.shape[0]]);
            const noise_b = tf.randomNormal([b_v.shape[0]]);
            const sample = {
                weights: w_v.mul(noise_w).add(w),
                biases: b,
            }
            // const sample = {
            //     weights: weights_dist.w,
            //     biases: weights_dist.b,
            // }
            optimizer.minimize(() => {
                const predsYs = predict(tf.tensor2d(train_xs[iter], [1, 1]), sample);
                return loss(predsYs, tf.tensor1d(train_ys[iter]));
            });
        }
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

    function setup() {
        curve_plotter.add_group("fixed");
        curve_plotter.add_group("float");
        graph_plotter.add_group("fixed");
        graph_plotter.add_group("float");
        plot_train_and_valid_points();
        plot();
    }

    function plot() {
        plot_path();
        // graph_plotter.plot_neural_net(net, "#float");
    }

    function plot_path() {
        const seed =  [1, 2, 3, 4, 5];
        const samples = seed.map(s => {
            return {
                weights: w_v.mul(tf.randomNormal([w_v.shape[0]], 0, 1, 'float32', s)).add(w),
                biases: b_v.mul(tf.randomNormal([b_v.shape[0]], 0, 1, 'float32', s)).add(b),
            }
        })
        // const sample = {
        //     weights: w,
        //     biases: b,
        // }
        var curves = samples.map(sample => {
            return curve_x_extended.map(x => {
                return {x: x, y: predict(tf.tensor2d([x], [1, 1]), sample).dataSync()[0]};
            })
        });
        curve_plotter.plot_path(curves, {
            color: "darkorange",
            width: 3,
            opacity: 0.5,
            id: "#float"
        });
    }

    function plot_train_and_valid_points() {
        curve_plotter.plot_points(validation_points_data, {
            stroke: "black",
            color: "black",
            size: 3,
            opacity: 0.5,
            id: "#fixed"
        });
    }
}
