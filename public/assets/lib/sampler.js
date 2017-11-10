function sampler(div, posterior_div, progress_div) {

    // svg properties
    var svg = div.append("svg");
    var svg2 = posterior_div.append("svg");
    var svg3 = progress_div.append("svg");
    svg.attr("width", param.w).attr("height", param.h);
    svg2.attr("width", param.w_loss + 20).attr("height", param.h_loss + 20);
    svg3.attr("width", param.w_progress + 20).attr("height", param.h_progress);

    var progress_domain_x = [0, 1];
    var progress_domain_y = [0, 8];

    var curve_plotter = Plotter(svg, param.curve_domain_x, param.curve_domain_y, param.w, param.h);
    var posterior_plotter = Plotter(svg2, param.loss_domain_x, param.loss_domain_y, param.w_loss, param.h_loss);
    var progress_plotter = Plotter(svg3, progress_domain_x, progress_domain_y, param.w_progress, param.h_progress);

    var x_scale_loss_inverse = d3.scaleLinear().domain([0, param.w_loss]).range(param.loss_domain_x);
    var y_scale_loss_inverse = d3.scaleLinear().domain([param.h_loss, 0]).range(param.loss_domain_y);

    var posterior_data = new Array(param.n * param.m);
    var sampling_interval = new Array(param.n * param.m);

    //define a neural network
    var net = make_preset_net();

    var sampled_nets = [];
    var sample_predictions = [];
    var sampled_weights = [];
    var avg_pred_by_train = [];
    var avg_curve_by_train = [];
    var loss_for_samples = [];
    var rng = new Math.seedrandom('Toronto');

    setup();
    initial_plot();

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

    function setup() {
        var dummy_net = make_preset_net();
        var logprob = 0;
        var log_sum_exp = 0;
        for (var w_2 = 0, k = 0; w_2 < param.m; w_2++) {
            for (var w_1 = 0; w_1 < param.n; w_1++, k++) {
                logprob = get_posterior(dummy_net, x_scale_loss_inverse(w_1 * param.scaling_factor), y_scale_loss_inverse(w_2 * param.scaling_factor));
                posterior_data[k] = logprob;
                log_sum_exp += Math.exp(-logprob);
            }
        }
        log_sum_exp = Math.log(log_sum_exp);
        sampling_interval[0] = 0;
        for (var i = 1; i < sampling_interval.length; i++) {
            sampling_interval[i] = sampling_interval[i - 1] + Math.exp(-posterior_data[i] - log_sum_exp);
        }
        posterior_plotter.add_x_axis_label("w1");
        posterior_plotter.add_y_axis_label("w2");
        progress_plotter.add_y_axis_label("Average Loss");
    }

    function reset() {
        sampled_nets = [];
        sampled_weights = [];
        sample_predictions = [];
        avg_curve_by_train = [];
        avg_pred_by_train = [];
        loss_for_samples = [];
        clear();
        plot();
    }

    function sample_train() {
        var uniform = rng();
        for (var i = 0; uniform > sampling_interval[i]; i++) {}
        var n_sampled = i % param.m;
        var m_sampled = (i - n_sampled) / param.n;
        sampled_weights.push({
            x: x_scale_loss_inverse(n_sampled * param.scaling_factor),
            y: y_scale_loss_inverse(m_sampled * param.scaling_factor)
        });
        var sampled_net = make_preset_net();
        sampled_net.getLayer(1).setWeights([
            [x_scale_loss_inverse(n_sampled * param.scaling_factor)],
            [y_scale_loss_inverse(m_sampled * param.scaling_factor)]
        ]);
        sampled_nets.push(sampled_net);

        point_predictions = predicted_points(sampled_net);
        sample_predictions.push(point_predictions.curve);

        if (avg_pred_by_train.length == 0) {
            avg_pred_by_train = point_predictions.valid;
            avg_curve_by_train = point_predictions.curve;
        } else {
            for (var i = 0; i < avg_pred_by_train.length; i++) {
                avg_pred_by_train[i].y = avg_pred_by_train[i].y * (sampled_nets.length - 1) / sampled_nets.length + point_predictions.valid[i].y / sampled_nets.length;
            }
            for (var i = 0; i < avg_curve_by_train.length; i++) {
                avg_curve_by_train[i].y = avg_curve_by_train[i].y * (sampled_nets.length - 1) / sampled_nets.length + point_predictions.curve[i].y / sampled_nets.length;
            }
        }

        //compute the loss for the average curve
        var total_loss = 0;
        var predicted;
        var true_label;
        for (var j = 0; j < param.validation_points.length; j++) {
            true_label = Math.sin(param.validation_points[j]) + param.validation_noise[j];
            total_loss += 0.5 * (true_label - avg_pred_by_train[j].y) * (true_label - avg_pred_by_train[j].y);
        }
        loss_for_samples.push(total_loss);
        clear();
        plot();
    }

    function predicted_points(net) {
        points = {};
        predicted_curve = [];
        valid = [];
        for (var i = -6; i < 6; i += param.step_size) {
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
        plot_line();
        plot_weight();
    }

    function plot_line() {
        for (var i = 0; i < sample_predictions.length; i++) {
            curve_plotter.plot_line(sample_predictions[i], {
                color: "orange",
                width: 1,
                opacity: 0.3
            });
        }
        var avg_loss_data = [];
        for (var i = 0; i < loss_for_samples.length; i++) {
            avg_loss_data.push({
                x: (i + 1) / (loss_for_samples.length + 1),
                y: loss_for_samples[i]
            });
        }
        progress_plotter.plot_line(avg_loss_data, {
            color: "black",
            width: 3,
            opacity: 1
        });
        // Also plot the average over sampled nets from training posterior
        curve_plotter.plot_line(avg_curve_by_train, {
            color: "red",
            width: 3,
            opacity: 1
        });

        MLE = [];
        overfit = [];
        for (var i = 0; i < 1; i += param.step_size) {
            MLE.push({x: i, y: 2.7963}); //MLE validation loss
            overfit.push({x: i, y: 3.1934}); //MLE validation loss
        }
        progress_plotter.plot_line(overfit, {
            color: "darkred",
            width: 2,
            opacity: 0.5
        });
        progress_plotter.plot_line(MLE, {
            color: "darkgreen",
            width: 2,
            opacity: 0.5
        });
        posterior_plotter.plot_points([{x:0.8133331298828126, y:1.4501043701171876}], {
            stroke: "black",
            color: "darkgreen",
            size: 5,
            opacity: 1
        });
        posterior_plotter.plot_points([{x:0.8533331298828124, y:0.04666687011718773}], {
            stroke: "black",
            color: "darkred",
            size: 5,
            opacity: 1
        });
    }

    function plot_weight() {
        posterior_plotter.plot_points(sampled_weights, {
            stroke: "black",
            color: "darkorange",
            size: 4,
            opacity: 1,
            mouseover: mouseover,
            mouseout: mouseout
        });
    }

    function clear() {
        svg.selectAll("path").remove();
        svg2.selectAll("circle").remove();
        svg3.selectAll("circle").remove();
        svg3.selectAll("path").remove();
    }

    function initial_plot() {
        plot_points();
        plot_posterior();
    }

    function plot_points() {
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
            opacity: 1
        });
        curve_plotter.plot_points(validation_points_data, {
            stroke: "teal",
            color: "teal",
            size: 4,
            opacity: 1
        });
    }

    function plot_posterior() {
        var color = d3.scaleLinear().domain([-0.1, 2]).interpolate(function() {
            return d3.interpolateSpectral;
        });
        var contours = d3.contours().size([param.n, param.m]).thresholds(d3.range(0.1, 5, 0.1));
        posterior_plotter.plot_contour(posterior_data, {
            n: param.n,
            m: param.m,
            color_scale: color,
            contour_scale: contours
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
