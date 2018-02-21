function sampler(curve_div, posterior_div, progress_div) {

    var curve_plotter = Plotter(curve_div, param.curve_domain_x, param.curve_domain_y, false, false);
    var posterior_plotter = Plotter(posterior_div, param.loss_domain_x, param.loss_domain_y, true, true);
    var progress_plotter = Plotter(progress_div, param.progress_domain_x, param.progress_domain_y, false, false);

    var inv_x_scale = d3.scaleLinear().domain([0, param.w_loss]).range(param.loss_domain_x);
    var inv_y_scale = d3.scaleLinear().domain([param.h_loss, 0]).range(param.loss_domain_y);

    var posterior_data = new Array(param.n * param.m);
    var sampling_interval = new Array(param.n * param.m);

    //define a neural network
    var net = make_preset_net();
    var rng = new Math.seedrandom('Toronto');

    var sampled_weights = [];
    var avg_prediction = [];
    var avg_curve_points = [];
    var test_loss_for_avg_prediction = [];

    setup();
    initial_plot();

    function setup() {
        var dummy_net = make_preset_net();
        var logprob = 0;
        var log_sum_exp = 0;
        for (var w_2 = 0, k = 0; w_2 < param.m; w_2++) {
            for (var w_1 = 0; w_1 < param.n; w_1++, k++) {
                logprob = get_posterior(dummy_net, inv_x_scale(w_1 * param.scaling_factor), inv_y_scale(w_2 * param.scaling_factor));
                posterior_data[k] = logprob;
                log_sum_exp += Math.exp(-logprob);
            }
        }
        log_sum_exp = Math.log(log_sum_exp);
        sampling_interval[0] = 0;
        for (var i = 1; i < sampling_interval.length; i++) {
            sampling_interval[i] = sampling_interval[i - 1] + Math.exp(-posterior_data[i] - log_sum_exp);
        }
        curve_plotter.add_group("fixed");
        posterior_plotter.add_group("fixed");
        progress_plotter.add_group("fixed");
        curve_plotter.add_group("float");
        posterior_plotter.add_group("float");
        progress_plotter.add_group("float");

        posterior_plotter.add_x_axis_label("w1");
        posterior_plotter.add_y_axis_label("w2");
    }

    function initial_plot() {
        plot_datapoints();
        plot_posterior();
        plot_MLE();
        plot_sample_dist();
    }

    function reset() {
        rng = new Math.seedrandom('Toronto');
        sampled_weights = [];
        avg_curve_points = [];
        avg_prediction = [];
        test_loss_for_avg_prediction = [];
        curve_plotter.svg.select("#float").selectAll("*").remove();
        clear();
        plot();
    }

    function clear() {
        progress_plotter.svg.select("#float").selectAll("*").remove();
        posterior_plotter.svg.select("#float").selectAll("*").remove();
    }

    function plot_sample_dist() {
        var random = new Math.seedrandom("Vector");
        var sample_size = 500;
        var sampled_nets = [];
        var percentiles = []; // 10, 25, 45, 55, 75, 90
        for (var i = 0; i < 100; i++) {
            percentiles.push([]);
        }
        // sample 100 nets
        for (var net_idx = 0; net_idx < sample_size; net_idx++) {
            var seed = random();
            for (var i = 0; seed > sampling_interval[i]; i++) {}
            var n_sampled = i % param.m;
            var m_sampled = (i - n_sampled) / param.n;
            sampled_net = make_preset_net();
            sampled_net.getLayer(1).setWeights([
                [inv_x_scale(n_sampled * param.scaling_factor)],
                [inv_y_scale(m_sampled * param.scaling_factor)]
            ]);
            sampled_nets.push(sampled_net);
        }

        // collect percentile for each point
        for (var i = -5; i <= 5; i += param.step_size) {
            x_val = new net_lib.Vol([i]);
            single_point_pred = sampled_nets.map(x => {
                return x.forward(x_val).w[0];
            })

            single_point_pred.sort((a,b) => {return a-b;});
            for (var j = 0; j < percentiles.length; j++) {
                percentiles[j].push({x: i, y: single_point_pred[Math.floor(0.01 * j * sample_size)]});
            }
        }

        // plot the percentile of the samples
        for (var i = 0; i < percentiles.length / 2; i++) {
            curve_plotter.plot_line(percentiles[i].concat(percentiles[percentiles.length - 1 - i].reverse()), {
				color: "red",
				fill: "red",
				width: 1,
				opacity: 1 / (percentiles.length - i),
				id: "#fixed"
			});
        }
    }

    function sample_train() {
        var seed = rng();
        var sampled_net = get_sampled_net(seed);
        predictions = predicted_points(sampled_net);

        curve_plotter.plot_line(predictions.curve, {
            color: "darkblue",
            width: 1,
            opacity: 0.3,
            id: "#float"
        });

        online_update_average(predictions);

        var total_loss = get_test_loss_from_prediction(avg_prediction)
        test_loss_for_avg_prediction.push(total_loss);
        clear();
        plot();
    }

    function get_sampled_net(seed) {
        for (var i = 0; seed > sampling_interval[i]; i++) {}
        var n_sampled = i % param.m;
        var m_sampled = (i - n_sampled) / param.n;
        sampled_weights.push({
            x: inv_x_scale(n_sampled * param.scaling_factor),
            y: inv_y_scale(m_sampled * param.scaling_factor)
        });
        sampled_net = make_preset_net();
        sampled_net.getLayer(1).setWeights([
            [inv_x_scale(n_sampled * param.scaling_factor)],
            [inv_y_scale(m_sampled * param.scaling_factor)]
        ]);
        return sampled_net;
    }

    function online_update_average(predictions) {
        if (avg_prediction.length == 0) {
            avg_prediction = predictions.valid;
            avg_curve_points = predictions.curve;
        } else {
            for (var i = 0; i < avg_prediction.length; i++) {
                avg_prediction[i].y = avg_prediction[i].y * test_loss_for_avg_prediction.length / (test_loss_for_avg_prediction.length + 1) + predictions.valid[i].y / (test_loss_for_avg_prediction.length + 1);
            }
            for (var i = 0; i < avg_curve_points.length; i++) {
                avg_curve_points[i].y = avg_curve_points[i].y * test_loss_for_avg_prediction.length / (test_loss_for_avg_prediction.length + 1) + predictions.curve[i].y / (test_loss_for_avg_prediction.length + 1);
            }
        }
    }

    function get_test_loss_from_prediction(avg_prediction) {
        var total_loss = 0;
        var predicted;
        var true_label;
        for (var j = 0; j < param.validation_points.length; j++) {
            true_label = Math.sin(param.validation_points[j]) + param.validation_noise[j];
            total_loss += 0.5 * (true_label - avg_prediction[j].y) * (true_label - avg_prediction[j].y);
        }
        return total_loss;
    }

    function make_preset_net() {
        var layer_defs = [];
        layer_defs.push({type: 'input', out_sx: 1, out_sy: 1, out_depth: 1});
        layer_defs.push({type: 'fc', num_neurons: 2, activation: 'tanh'});
        layer_defs.push({type: 'fc', num_neurons: 4, activation: 'tanh'});
        layer_defs.push({type: 'fc', num_neurons: 4, activation: 'tanh'});
        layer_defs.push({type: 'regression', num_neurons: 1});
        var new_net = new net_lib.Net();
        new_net.makeLayers(layer_defs);
        new_net.getLayer(3).setWeights(param.opt_layer3_w);
        new_net.getLayer(5).setWeights(param.opt_layer5_w);
        new_net.getLayer(7).setWeights(param.opt_layer7_w);
        new_net.getLayer(1).setBiases(param.opt_layer1_b);
        new_net.getLayer(3).setBiases(param.opt_layer3_b);
        new_net.getLayer(5).setBiases(param.opt_layer5_b);
        new_net.getLayer(7).setBiases(param.opt_layer7_b);
        return new_net;
    }

    function predicted_points(net) {
        points = {};
        predicted_curve = [];
        valid = [];
        for (var i = -5; i <= 5; i += param.step_size) {
            x_val = new net_lib.Vol([i]);
            predicted_value = net.forward(x_val);
            predicted_curve.push({x: i, y: predicted_value.w[0]});
        }
        for (var j = 0; j < param.validation_points.length; j++) {
            x_val = new net_lib.Vol([param.validation_points[j]]);
            predicted_value = net.forward(x_val);
            valid.push({x: param.validation_points[j], y: predicted_value.w[0]});
        }
        points.curve = predicted_curve;
        points.valid = valid;
        return points;
    }

    function plot() {
        plot_avg();
        plot_weight();
    }

    function plot_avg() {
        var avg_loss_data = [];
        for (var i = 0; i < test_loss_for_avg_prediction.length; i++) {
            avg_loss_data.push({
                x: (i + 1) / (test_loss_for_avg_prediction.length + 1),
                y: test_loss_for_avg_prediction[i]
            });
        }
        progress_plotter.plot_line(avg_loss_data, {
            color: "black",
            width: 3,
            opacity: 1,
            id: "#float"
        });
        // Also plot the average over sampled nets from training posterior
        // curve_plotter.plot_line(avg_curve_points, {
        //     color: "red",
        //     width: 3,
        //     opacity: 1,
        //     id: "#float"
        // });
    }

    function plot_weight() {
        posterior_plotter.plot_points(sampled_weights, {
            stroke: "black",
            color: "darkorange",
            size: 4,
            opacity: 1,
            mouseover: mouseover,
            mouseout: mouseout,
            id: "#float"
        });
    }

    function plot_MLE() {
        MLE = [];
        overfit = [];
        for (var i = 0; i < 1; i += param.step_size) {
            MLE.push({x: i, y: 2.7963}); //MLE validation loss
            overfit.push({x: i, y: 3.1934}); //MLE validation loss
        }
        progress_plotter.plot_line(overfit, {
            color: "darkred",
            width: 2,
            opacity: 0.5,
            id: "#fixed"
        });
        progress_plotter.plot_line(MLE, {
            color: "darkgreen",
            width: 2,
            opacity: 0.5,
            id: "#fixed"
        });
        posterior_plotter.plot_points([
            {
                x: 0.8133331298828126,
                y: 1.4501043701171876
            }
        ], {
            stroke: "black",
            color: "darkgreen",
            size: 5,
            opacity: 1,
            id: "#fixed"
        });
        posterior_plotter.plot_points([
            {
                x: 0.8023331298828124,
                y: 0.09676687011718773
            }
        ], {
            stroke: "black",
            color: "darkred",
            size: 5,
            opacity: 1,
            id: "#fixed"
        });
    }

    function plot_datapoints() {
        //individual training and validation points
        training_points_data = [];
        //training data points
        for (var i = 0; i < param.train_points.length; i++) {
            training_points_data.push({
                x: param.train_points[i],
                y: Math.sin(param.train_points[i]) + param.train_noise[i]
            });
        }
        validation_points_data = [];
        //training data points
        for (var i = 0; i < param.validation_points.length; i++) {
            validation_points_data.push({
                x: param.validation_points[i],
                y: Math.sin(param.validation_points[i]) + param.validation_noise[i]
            });
        }
        curve_plotter.plot_points(training_points_data, {
            stroke: "red",
            color: "red",
            size: 4,
            opacity: 1,
            id: "#fixed"
        });
        curve_plotter.plot_points(validation_points_data, {
            stroke: "teal",
            color: "teal",
            size: 4,
            opacity: 1,
            id: "#fixed"
        });
    }

    function plot_posterior() {
        posterior_plotter.plot_contour(posterior_data, {
            n: param.n,
            m: param.m,
            color_scale: train_contour_color,
            contour_scale: train_contour_scale,
            id: "#fixed"
        });
    }

    function get_posterior(dummy_net, w_1, w_2) {
        var total_loss = 0;
        var predicted;
        var true_label;
        var x_val;
        dummy_net.getLayer(1).setWeights([[w_1], [w_2]]);
        for (var i = 0; i < param.train_points.length; i++) {
            x_val = new net_lib.Vol([param.train_points[i]]);
            true_label = Math.sin(param.train_points[i]) + param.train_noise[i];
            total_loss += dummy_net.getCostLoss(x_val, true_label);
        }
        return total_loss;
    }

    function mouseover() {
        var element = d3.select(this);
        element.attr("r", element.attr("r") * 2);
    }

    function mouseout() {
        var element = d3.select(this);
        element.attr("r", element.attr("r") / 2);
    }

    return {plot: plot, sample_train: sample_train, reset: reset};
}
