function hero(curve_div, graph_div) {

    this.div_id = curve_div.attr('id');
    tf.setBackend('cpu');
    const eps = tf.scalar(1e-9);
    const minLogSigma = -0.5;
    const maxLogSigma = -0;
    const shape = tf.tensor1d([1, 5, 5, 1], 'int32');
    const w = tf.variable(tf.randomNormal(shape.slice([0], [shape.shape[0] - 1]).mul(shape.slice([1])).sum().flatten().dataSync(), 0, 1, 'float32', 6787));
    const w_v = tf.variable(tf.randomUniform(shape.slice([0], [shape.shape[0] - 1]).mul(shape.slice([1])).sum().flatten().dataSync(), minLogSigma, maxLogSigma, 'float32', 9876));
    const b = tf.variable(tf.randomNormal(shape.slice([1]).sum().flatten().dataSync(), 0, 1, 'float32', 2942));
    const b_v = tf.variable(tf.randomUniform(shape.slice([1]).sum().flatten().dataSync(), minLogSigma, maxLogSigma, 'float32', 1925));
    const noise_w = tf.randomNormal([w_v.shape[0]]);
    const noise_b = tf.randomNormal([b_v.shape[0]]);
    // const weights = w;
    const weights = w.add(noise_w.mul(tf.exp(w_v.add(eps))));
    const biases = b;
    // const biases = b.add(noise_b.mul(tf.exp(b_v.add(eps))));

    this.start = async function() {
        plot_interval = d3.timer(plot, 100);
        if (!training_interval) {
            console.log("started training");
            while (true) {
                await train();
            }
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
            x = tf.transpose(x);
            const unpacked = unpack_sample(sample);
            for (var i = 0; i < unpacked.weights.length; i++) {
                x = unpacked.weights[i].matMul(x).elu(0.1).add(unpacked.biases[i]);
            }
            return tf.transpose(x);
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

    async function train() {
        const optimizer = tf.train.sgd(0.01);
        for (let iter = 0; iter < 5; iter++) {
            optimizer.minimize(() => {
                const predsYs = predict(tf.tensor2d(train_xs), {weights: weights, biases: biases}); // input N*D
                return loss(predsYs, tf.tensor2d(train_ys));
            });
        }
        await tf.nextFrame();
    }

    function unpack_sample(sample) {
        var shape = [1, 5, 5, 1]
        return tf.tidy(() => {
            var w_ind = 0;
            var b_ind = 0;
            var unpacked = {
                weights: [],
                biases: []
            };
            for (var i = 0; i < shape.length - 1; i++) {
                unpacked.weights.push(sample.weights.slice([w_ind], [shape[i] * shape[i + 1]]).reshape([shape[i + 1], shape[i]]));
                unpacked.biases.push(sample.biases.slice([b_ind], [shape[i + 1]]).reshape([shape[i + 1], 1]));
                w_ind += shape[i] * shape[i + 1];
                b_ind += shape[i + 1];
            }
            return unpacked;
        });
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
        // var curves = [curve_x_extended.map(x => {
        //         return {x: x, y: predict(tf.tensor2d([x], [1, 1])).dataSync()[0]};];
        // curve_plotter.plot_path(curves, {
        //     color: "darkorange",
        //     width: 2,
        //     opacity: 0.5,
        //     id: "#float"
        // });
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
