function rwtf(curve_div, use_validation_data) {

    this.div_id = curve_div.attr('id');
    var last_sample = [
        tf.randomNormal([1, 10], 0, 0.25),
        tf.zeros([10]),
        tf.randomNormal([10, 10], 0, 0.25),
        tf.zeros([10]),
        tf.randomNormal([10, 1], 0, 0.25),
        tf.zeros([1]),
    ];

    var last_loss = 0;
    var training;

    async function start() {
        training = true;
        while (training) {
            await sample();
            plot();
        }
    }

    function stop() {
        training = false;
    }

	function is_running() {
		return training;
	}

    var curve_plotter = new Plotter(curve_div, param.curve_domain_x_extended, param.curve_domain_y, false, false);

    var predictions = new Array(curve_x_extended.length);

    initial_plot();

    predictions = predict(last_sample, tf.tensor2d(curve_x_extended, [curve_x_extended.length, 1])).dataSync();

    function initial_plot() {
        curve_plotter.add_group("lastproposal");
        curve_plotter.add_group("lastsample");
        curve_plotter.add_group("fixed");
        plot_training_data();
    }

    async function sample() {
        var std = Math.log(0.05);
        var new_sample = propose(last_sample, std);

        var transition_prob = Math.min(0, tf.exp(tf.losses.meanSquaredError(predict(last_sample, tf.tensor2d(train_xs)), tf.tensor2d(train_ys))).dataSync() - tf.exp(tf.losses.meanSquaredError(predict(new_sample, tf.tensor2d(train_xs)), tf.tensor2d(train_ys))).dataSync());

        if (Math.random() <= transition_prob) {
            // accept
			predictions = predict(new_sample, tf.tensor2d(curve_x_extended, [curve_x_extended.length, 1])).dataSync();
			last_sample = new_sample;
        } else {
			predictions = predict(last_sample, tf.tensor2d(curve_x_extended, [curve_x_extended.length, 1])).dataSync();
		}

        await tf.nextFrame();
    }

    function propose(last, std) {
        return last.map(w => {
            return w.add(tf.randomNormal(w.shape, 0, std));
        });
    }

	function predict(ws, x) {
        const layer1 = tf.tidy(() => {
            return x.mul(tf.sigmoid(x.matMul(ws[0]).add(ws[1])));
        });
        const layer2 = tf.tidy(() => {
            return layer1.mul(tf.sigmoid(layer1.matMul(ws[2]).add(ws[3])));
        });
        return layer2.matMul(ws[4]).add(ws[5]);
    }

    function plot() {
        var pts = curve_x_extended.map((x, n) => {
            return {x: x, y: predictions[n]}
        });
        curve_plotter.plot_path([pts], {
            color: "green",
            width: 2,
            opacity: 1,
            id: "#lastsample"
        });
    }

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

    return {start: start, stop: stop, is_running: is_running};
}
