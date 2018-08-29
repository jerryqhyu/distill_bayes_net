function rwtf(curve_div, use_validation_data) {

    this.div_id = curve_div.attr('id');
    var last_sample = [
        tf.randomNormal([1, 2], 0, 1),
        tf.zeros([2]),
        tf.randomNormal([2, 4], 0, 1),
        tf.zeros([4]),
        tf.randomNormal([4, 4], 0, 1),
        tf.zeros([4]),
        tf.randomNormal([4, 1], 0, 1),
        tf.zeros([1]),
    ];

    var training;

    async function start() {
        training = true;
        while (training && predictions.length < 25) {
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

    initial_plot();

    var predictions = [tf.tidy(() => {
        return predict(last_sample, tf.tensor2d(curve_x_extended, [curve_x_extended.length, 1])).dataSync()
    })];

    function initial_plot() {
        curve_plotter.add_group("lastproposal");
        curve_plotter.add_group("accepted");
        curve_plotter.add_group("fixed");
        plot_training_data();
    }

    async function sample() {
        var std = 1;
        var new_sample = propose(last_sample, std);
        plot_new_sample(new_sample);
        var transition_prob = tf.tidy(() => {
            const last_loss = tf.exp(tf.losses.meanSquaredError(predict(last_sample, tf.tensor2d(train_xs)), tf.tensor2d(train_ys)));
            const new_loss = tf.exp(tf.losses.meanSquaredError(predict(new_sample, tf.tensor2d(train_xs)), tf.tensor2d(train_ys)));
            return Math.min(1, last_loss.dataSync() - new_loss.dataSync())
        });

        if (Math.random() <= transition_prob) {
            var prediction = tf.tidy(() => {
                const p = predict(new_sample, tf.tensor2d(curve_x_extended, [curve_x_extended.length, 1]));
                return p.dataSync()
            });
			predictions.push(prediction);
            last_sample.forEach(w => w.dispose());
            last_sample = new_sample;
        }
        
        await tf.nextFrame();
    }

    function propose(last, std) {
        return tf.tidy(() => {
            return last.map(w => {
                return w.add(tf.randomNormal(w.shape, 0, std));
            });
        });
    }

	function predict(ws, x) {
        return tf.tidy(() => {
            const l1 = tf.tanh(x.matMul(ws[0]).add(ws[1]));
            const l2 = tf.tanh(l1.matMul(ws[2]).add(ws[3]));
            const l3 = tf.tanh(l2.matMul(ws[4]).add(ws[5]));
            return l3.matMul(ws[6]).add(ws[7]);
        });
    }

    function plot_new_sample(new_sample) {
        var new_sample_pred = tf.tidy(() => {
            const p = predict(new_sample, tf.tensor2d(curve_x_extended, [curve_x_extended.length, 1]));
            return p.dataSync()
        });
        var pts = [curve_x_extended.map((p, n) => {
            return {
                x: p,
                y: new_sample_pred[n]
            };
        })];

        curve_plotter.plot_path(pts, {
            color: "red",
            width: 1,
            opacity: 1,
            id: "#lastproposal"
        });
    }

    function plot() {
        var pts = predictions.map((p) => {
            var curve = new Array(p.length);
            p.forEach((x, n) => {
                curve[n] = {x: curve_x_extended[n], y: x};
            });
            return curve;
        });

        curve_plotter.plot_path(pts, {
            color: "green",
            width: 1,
            opacity: 1,
            id: "#accepted"
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
