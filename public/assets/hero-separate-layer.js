function herosep(curve_div, graph_div) {

    this.div_id = curve_div.attr('id');
    // tf.setBackend('cpu')

    const eps = tf.scalar(1e-9);
    const minLogSigma = -1.0;
    const maxLogSigma = -0.5;
   
    const layer1WeightsMu = tf.variable(tf.randomNormal([1, 20], 0, 0.1));
    const layer1WeightsLogSigma = tf.variable(tf.randomUniform(layer1WeightsMu.shape, minLogSigma, maxLogSigma));
    const layer1WeightsEpsilon = tf.randomNormal(layer1WeightsMu.shape);
    const layer1BiasMu = tf.variable(tf.zeros([20]));
    const layer1BiasLogSigma = tf.variable(tf.randomUniform(layer1BiasMu.shape, minLogSigma, maxLogSigma));
    const layer1BiasEpsilon = tf.randomNormal(layer1BiasMu.shape);

    const layer2WeightsMu = tf.variable(tf.randomNormal([20, 20], 0, 0.1));
    const layer2WeightsLogSigma = tf.variable(tf.randomUniform(layer2WeightsMu.shape, minLogSigma, maxLogSigma));
    const layer2WeightsEpsilon = tf.randomNormal(layer2WeightsMu.shape);
    const layer2BiasMu = tf.variable(tf.zeros([20]));
    const layer2BiasLogSigma = tf.variable(tf.randomUniform(layer2BiasMu.shape, minLogSigma, maxLogSigma));
    const layer2BiasEpsilon = tf.randomNormal(layer2BiasMu.shape);

    const layer3WeightsMu = tf.variable(tf.randomNormal([20, 1], 0, 0.1));
    const layer3WeightsLogSigma = tf.variable(tf.randomUniform(layer3WeightsMu.shape, minLogSigma, maxLogSigma));
    const layer3WeightsEpsilon = tf.randomNormal(layer3WeightsMu.shape);
    const layer3BiasMu = tf.variable(tf.zeros([1]));
    const layer3BiasLogSigma = tf.variable(tf.randomUniform(layer3BiasMu.shape, minLogSigma, maxLogSigma));
    const layer3BiasEpsilon = tf.randomNormal(layer3BiasMu.shape);

    const layer1WeightsSigma = tf.exp(layer1WeightsLogSigma.add(eps));
    const layer1Weights = layer1WeightsMu.add(layer1WeightsSigma.mul(layer1WeightsEpsilon));
    const layer1BiasSigma = tf.exp(layer1BiasLogSigma.add(eps));
    const layer1Bias = layer1BiasMu.add(layer1BiasSigma.mul(layer1BiasEpsilon));

    const layer2WeightsSigma = tf.exp(layer2WeightsLogSigma.add(eps));
    const layer2Weights = layer2WeightsMu.add(layer2WeightsSigma.mul(layer2WeightsEpsilon));
    const layer2BiasSigma = tf.exp(layer2BiasLogSigma.add(eps));
    const layer2Bias = layer2BiasMu.add(layer2BiasSigma.mul(layer2BiasEpsilon));

    const layer3WeightsSigma = tf.exp(layer3WeightsLogSigma.add(eps));
    const layer3Weights = layer3WeightsMu.add(layer3WeightsSigma.mul(layer3WeightsEpsilon));
    const layer3BiasSigma = tf.exp(layer3BiasLogSigma.add(eps));
    const layer3Bias = layer3BiasMu.add(layer3BiasSigma.mul(layer3BiasEpsilon));

    this.start = async function() {
        if (!training_interval) {
            console.log("started training");
            for (var i = 0; i < 100; i++) {
                await train();
            }
            plot_interval = d3.timer(plot, 300);
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

    function predict(x) { 
        const layer1 = tf.tidy(() => {
            return x.matMul(layer1Weights).add(layer1Bias).relu();
        });
        const layer2 = tf.tidy(() => {
            return layer1.matMul(layer2Weights).add(layer2Bias).relu();
        });
        return tf.transpose(layer2.matMul(layer3Weights).add(layer3Bias));
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
        const optimizer = tf.train.sgd(0.005);
        for (let iter = 0; iter < 5; iter++) {
            optimizer.minimize(() => {
                const predsYs = predict(tf.tensor2d(train_xs)); // input N*D
                return loss(predsYs, tf.tensor2d(train_ys));
            });
        }

        await tf.nextFrame();
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
        // const seed =  [1, 2, 3, 4, 5];
        // const samples = seed.map(s => {
        //     return {
        //         weights: w_v.mul(tf.randomNormal([w_v.shape[0]], 0, 1, 'float32', s)).add(w),
        //         biases: b_v.mul(tf.randomNormal([b_v.shape[0]], 0, 1, 'float32', s)).add(b),
        //     }
        // })
        // const samples = [{
        //     weights: w,
        //     biases: b,
        // }]
        // var curves = samples.map(sample => {
        //     return curve_x_extended.map(x => {
        //         return {x: x, y: predict(tf.tensor2d([x], [1, 1]), sample).dataSync()[0]};
        //     })
        // });
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