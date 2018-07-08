function herosep(curve_div, graph_div) {

    this.div_id = curve_div.attr('id');
    tf.setBackend('cpu')

    const eps = tf.scalar(1e-9);
    const minLogSigma = -1.0;
    const maxLogSigma = -0.5;
    const optimizer = tf.train.sgd(0.01);   
    const layer1WeightsMu = tf.variable(tf.randomNormal([1, 5], 0, 0.5));
    const layer1WeightsLogSigma = tf.variable(tf.randomUniform(layer1WeightsMu.shape, minLogSigma, maxLogSigma));
    const layer1BiasMu = tf.variable(tf.zeros([5]));
    const layer1BiasLogSigma = tf.variable(tf.randomUniform(layer1BiasMu.shape, minLogSigma, maxLogSigma));

    const layer2WeightsMu = tf.variable(tf.randomNormal([5, 5], 0, 0.5));
    const layer2WeightsLogSigma = tf.variable(tf.randomUniform(layer2WeightsMu.shape, minLogSigma, maxLogSigma));
    const layer2BiasMu = tf.variable(tf.zeros([5]));
    const layer2BiasLogSigma = tf.variable(tf.randomUniform(layer2BiasMu.shape, minLogSigma, maxLogSigma));

    const layer3WeightsMu = tf.variable(tf.randomNormal([5, 5], 0, 0.5));
    const layer3WeightsLogSigma = tf.variable(tf.randomUniform(layer2WeightsMu.shape, minLogSigma, maxLogSigma));
    const layer3BiasMu = tf.variable(tf.zeros([5]));
    const layer3BiasLogSigma = tf.variable(tf.randomUniform(layer2BiasMu.shape, minLogSigma, maxLogSigma));

    const layer4WeightsMu = tf.variable(tf.randomNormal([5, 1], 0, 0.5));
    const layer4WeightsLogSigma = tf.variable(tf.randomUniform(layer4WeightsMu.shape, minLogSigma, maxLogSigma));
    const layer4BiasMu = tf.variable(tf.zeros([1]));
    const layer4BiasLogSigma = tf.variable(tf.randomUniform(layer4BiasMu.shape, minLogSigma, maxLogSigma));

    async function start() {
        plot();
        if (!training_interval) {
            console.log("started training");
            for (var i = 0; i < 1000; i++) {
                await train();
                plot();
            }
        }
    }

    function stop() {
        if (training_interval) {
            training_interval.stop();
            plot_interval.stop();
            training_interval = undefined;
            plot_interval = undefined;
        }
    }

    function is_running() {
        return training_interval != null;
    }

    function reset() {

    }

    function predict(x) { 
        const layer1Weights = layer1WeightsMu.add(tf.exp(layer1WeightsLogSigma.add(eps)).mul(tf.randomNormal(layer1WeightsMu.shape)));
        const layer1Bias = layer1BiasMu.add(tf.exp(layer1BiasLogSigma.add(eps)).mul(tf.randomNormal(layer1BiasMu.shape)));
        const layer2Weights = layer2WeightsMu.add(tf.exp(layer2WeightsLogSigma.add(eps)).mul(tf.randomNormal(layer2WeightsMu.shape)));
        const layer2Bias = layer2BiasMu.add(tf.exp(layer2BiasLogSigma.add(eps)).mul(tf.randomNormal(layer2BiasMu.shape)));
        const layer3Weights = layer3WeightsMu.add(tf.exp(layer3WeightsLogSigma.add(eps)).mul(tf.randomNormal(layer2WeightsMu.shape)));
        const layer3Bias = layer3BiasMu.add(tf.exp(layer3BiasLogSigma.add(eps)).mul(tf.randomNormal(layer2BiasMu.shape)));
        const layer4Weights = layer4WeightsMu.add(tf.exp(layer4WeightsLogSigma.add(eps)).mul(tf.randomNormal(layer4WeightsMu.shape)));
        const layer4Bias = layer4BiasMu.add(tf.exp(layer4BiasLogSigma.add(eps)).mul(tf.randomNormal(layer4BiasMu.shape)));
        
        const layer1 = tf.tidy(() => {
            return x.matMul(layer1Weights).add(layer1Bias).elu(0.1);
        });
        const layer2 = tf.tidy(() => {
            return layer1.matMul(layer2Weights).add(layer2Bias).elu(0.1);
        });
        const layer3 = tf.tidy(() => {
            return layer2.matMul(layer3Weights).add(layer3Bias).elu(0.1);
        });
        return layer3.matMul(layer4Weights).add(layer4Bias);
    }

    function predict(x, seed) { 
        const layer1Weights = layer1WeightsMu.add(tf.exp(layer1WeightsLogSigma.add(eps)).mul(tf.randomNormal(layer1WeightsMu.shape, 0, 1, 'float32', seed)));
        const layer1Bias = layer1BiasMu.add(tf.exp(layer1BiasLogSigma.add(eps)).mul(tf.randomNormal(layer1BiasMu.shape, 0, 1, 'float32', seed)));
        const layer2Weights = layer2WeightsMu.add(tf.exp(layer2WeightsLogSigma.add(eps)).mul(tf.randomNormal(layer2WeightsMu.shape, 0, 1, 'float32', seed)));
        const layer2Bias = layer2BiasMu.add(tf.exp(layer2BiasLogSigma.add(eps)).mul(tf.randomNormal(layer2BiasMu.shape, 0, 1, 'float32', seed)));
        const layer3Weights = layer3WeightsMu.add(tf.exp(layer3WeightsLogSigma.add(eps)).mul(tf.randomNormal(layer2WeightsMu.shape, 0, 1, 'float32', seed)));
        const layer3Bias = layer3BiasMu.add(tf.exp(layer3BiasLogSigma.add(eps)).mul(tf.randomNormal(layer2BiasMu.shape, 0, 1, 'float32', seed)));
        const layer4Weights = layer4WeightsMu.add(tf.exp(layer4WeightsLogSigma.add(eps)).mul(tf.randomNormal(layer4WeightsMu.shape, 0, 1, 'float32', seed)));
        const layer4Bias = layer4BiasMu.add(tf.exp(layer4BiasLogSigma.add(eps)).mul(tf.randomNormal(layer4BiasMu.shape, 0, 1, 'float32', seed)));
        
        const layer1 = tf.tidy(() => {
            return x.matMul(layer1Weights).add(layer1Bias).elu(0.1);
        });
        const layer2 = tf.tidy(() => {
            return layer1.matMul(layer2Weights).add(layer2Bias).elu(0.1);
        });
        const layer3 = tf.tidy(() => {
            return layer2.matMul(layer3Weights).add(layer3Bias).elu(0.1);
        });
        return layer3.matMul(layer4Weights).add(layer4Bias);
    }

    var curve_plotter = new Plotter(curve_div, param.curve_domain_x_extended, param.curve_domain_y, false, false);
    var graph_plotter = new Plotter(graph_div, param.nn_domain, param.nn_domain, false, false);

    //interval controller
    var training_interval;
    var plot_interval;
    setup();

    async function train() {
        for (let iter = 0; iter < 32; iter++) {
            optimizer.minimize(() => {
                const predsYs = predict(tf.tensor2d(train_xs)); // input N*D
                const loss = tf.losses.meanSquaredError(predsYs, tf.tensor2d(train_ys))
                return loss;
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
    }

    function plot_path() {
        var seed = [1,2,3,4,5, 1234, 12478, 86534, 22, 176475653423];      
        var curves = seed.map(s => {
            var d = [];
            predict(tf.tensor2d(curve_x_extended, [curve_x_extended.length, 1]), s).dataSync().forEach((y, i) => {
                d.push({x: curve_x_extended[i], y: y});
            })
            return d;
        });
        curve_plotter.plot_path(curves, {
            color: "darkorange",
            width: 2,
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

    return {start: start, stop: stop, is_running: is_running, reset: reset};
}