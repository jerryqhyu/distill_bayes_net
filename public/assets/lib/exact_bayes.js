function exact_bayes(div, train_posterior_div, progress_div, parameters) {

    //svg properties
    var h_progress = 150;
    var div = div;
    var train_posterior_div = train_posterior_div;
    var progress_div = progress_div;
    var svg = div.append("svg");
    var svg2 = train_posterior_div.append("svg");
    var svg3 = progress_div.append("svg");
    svg.attr("width", parameters.w)
    .attr("height", parameters.h);
    svg2.attr("width", parameters.w_loss*2)
    .attr("height", parameters.h_loss*2);
    svg3.attr("width", parameters.w)
    .attr("height", h_progress);

    var progress_domain_x = [0,1];
    var progress_domain_y = [0,20];

    var curve_plotter = Plotter(svg, parameters.curve_domain_x, parameters.curve_domain_y, parameters.w, parameters.h);
    var train_posterior_plotter = Plotter(svg2, parameters.loss_domain_x, parameters.loss_domain_y, parameters.w_loss*2, parameters.h_loss*2);
    var progress_plotter = Plotter(svg3, progress_domain_x, progress_domain_y, parameters.w, h_progress);

    var x_scale_loss_inverse = d3.scaleLinear().domain([0, parameters.w_loss*2]).range(parameters.loss_domain_x);
    var y_scale_loss_inverse = d3.scaleLinear().domain([parameters.h_loss*2,0]).range(parameters.loss_domain_y);

    var train_posterior_data = new Array(parameters.n * parameters.m);
    var train_sampling_interval = new Array(parameters.n * parameters.m);

    //define a neural network
    var net = make_preset_net();

    var train_sampled_nets = [];
    var train_sample_predictions = [];
    var train_sampled_weights = [];

    var avg_pred_by_train = [];
    var avg_curve_by_train = [];
    var loss_for_train_samples = [];

    setup();
    initial_plot();

    function make_preset_net() {
        var layer_defs = [];
        layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:1});
        layer_defs.push({type:'fc', num_neurons:2, activation:'tanh'});
        layer_defs.push({type:'fc', num_neurons:4, activation:'tanh'});
        layer_defs.push({type:'fc', num_neurons:4, activation:'tanh'});
        layer_defs.push({type:'regression', num_neurons:1});
        var new_net = new net_lib.Net();
        new_net.makeLayers(layer_defs);
        new_net.getLayer(3).setWeights(parameters.opt_layer3_w);
        new_net.getLayer(5).setWeights(parameters.opt_layer5_w);
        new_net.getLayer(7).setWeights(parameters.opt_layer7_w);
        new_net.getLayer(1).setBiases(parameters.opt_layer1_b);
        new_net.getLayer(3).setBiases(parameters.opt_layer3_b);
        new_net.getLayer(5).setBiases(parameters.opt_layer5_b);
        new_net.getLayer(7).setBiases(parameters.opt_layer7_b);
        return new_net;
    }

    function setup() {
        var dummy_net = make_preset_net();
        var logprob = 0;
        var train_log_sum_exp = 0;
        for (var w_2 = 0, k = 0; w_2 < parameters.m; w_2++) {
            for (var w_1 = 0; w_1 < parameters.n; w_1++, k++) {
                logprob = get_train_posterior(dummy_net, x_scale_loss_inverse(w_1*8), -x_scale_loss_inverse(w_2*8));
                train_posterior_data[k] = logprob;
                train_log_sum_exp += Math.exp(-logprob);
            }
        }
        train_log_sum_exp = Math.log(train_log_sum_exp);
        train_sampling_interval[0] = 0;
        for (var i = 1; i < train_sampling_interval.length; i++) {
            train_sampling_interval[i] = train_sampling_interval[i-1] + Math.exp(-train_posterior_data[i] - train_log_sum_exp);
        }
        console.log(train_sampling_interval[2000]);
    }

    function reset() {
        train_sampled_nets = [];
        train_sampled_weights = [];
        train_sample_predictions = [];
        avg_curve_by_train = [];
        avg_pred_by_train = [];
        loss_for_train_samples = [];
        clear();
        plot();
    }

    function sample_train() {
        var uniform = Math.random();
        for (var i = 0; uniform > train_sampling_interval[i]; i++) {}
        var n_sampled = i % parameters.m;
        var m_sampled = (i-n_sampled)/parameters.n;
        train_sampled_weights.push({
            x: x_scale_loss_inverse(n_sampled*8),
            y: -x_scale_loss_inverse(m_sampled*8)
        });
        var sampled_net = make_preset_net();
        sampled_net.getLayer(1).setWeights([[x_scale_loss_inverse(n_sampled*8)], [-x_scale_loss_inverse(m_sampled*8)]]);
        train_sampled_nets.push(sampled_net);

        point_predictions = predicted_points(sampled_net);
        train_sample_predictions.push(point_predictions.curve);

        if (avg_pred_by_train.length == 0) {
            avg_pred_by_train = point_predictions.valid;
            avg_curve_by_train = point_predictions.curve;
        } else {
            for (var i = 0; i < avg_pred_by_train.length; i++) {
                avg_pred_by_train[i].y = avg_pred_by_train[i].y * (train_sampled_nets.length-1)/train_sampled_nets.length + point_predictions.valid[i].y/train_sampled_nets.length;
            }
            for (var i = 0; i < avg_curve_by_train.length; i++) {
                avg_curve_by_train[i].y = avg_curve_by_train[i].y * (train_sampled_nets.length-1)/train_sampled_nets.length + point_predictions.curve[i].y/train_sampled_nets.length;
            }
        }

        //compute the loss for the average curve
        var total_loss = 0;
        var predicted;
        var true_label;
        for (var j = 0; j < parameters.validation_points.length; j++) {
            true_label = Math.sin(parameters.validation_points[j]) + parameters.validation_noise[j];
            total_loss += (true_label - avg_pred_by_train[j].y) * (true_label - avg_pred_by_train[j].y);
        }
        loss_for_train_samples.push(total_loss);
        clear();
        plot();
    }

    function predicted_points(net) {
        points = {};
        curve = [];
        valid = [];
        for (var i = -6; i < 6; i+=parameters.step_size) {
            x_val = new net_lib.Vol([i]);
            predicted_value = net.forward(x_val);
            curve.push({x:i,y:predicted_value.w[0]});
        }
        for (var j = 0; j < parameters.validation_points.length; j++) {
            x_val = new net_lib.Vol([parameters.validation_points[j]]);
            predicted_value = net.forward(x_val);
            valid.push({x:parameters.validation_points[j],y:predicted_value.w[0]});
        }
        points.curve = curve;
        points.valid = valid;
        return points;
    }

    function plot() {
        plot_line();
        plot_weight();
    }

    function plot_line() {
        for (var i = 0; i < train_sample_predictions.length; i++) {
            curve_plotter.plot_line(train_sample_predictions[i], "orange", 1, 0.3);
        }
        var avg_loss_data = [];
        for (var i = 0; i < loss_for_train_samples.length; i++) {
            avg_loss_data.push({x:(i+1)/(loss_for_train_samples.length+1), y:loss_for_train_samples[i]});
        }
        progress_plotter.plot_line(avg_loss_data, "black", 3, 1);
        // Also plot the average over sampled nets from training posterior
        curve_plotter.plot_line(avg_curve_by_train, "red", 3, 1);

        MLE = []
        for (var i = -6; i < 6; i+=parameters.step_size) {
            MLE.push({x:i,y:5.8890}); //MLE validation loss
        }
        progress_plotter.plot_line(MLE, "red", 1, 1);
    }

    function plot_weight() {
        train_posterior_plotter.plot_points(
            data=train_sampled_weights,
            stroke="black",
            color="darkorange",
            size=5,
            opacity=1,
        );
    }

    function clear() {
        svg.selectAll("path").remove();
        svg2.selectAll("circle").remove();
        svg3.selectAll("circle").remove();
        svg3.selectAll("path").remove();
    }

    function initial_plot() {
        plot_points();
        plot_train_posterior();
    }

    function plot_points() {
        //individual training and validation points
        training_points_data = [];
        //training data points
        for (var i = 0; i < parameters.train_points.length; i++) {
            training_points_data.push({
                x: parameters.train_points[i],
                y: Math.sin(parameters.train_points[i])+parameters.train_noise[i]
            });
        }
        validation_points_data = [];
        //training data points
        for (var i = 0; i < parameters.validation_points.length; i++) {
            validation_points_data.push({
                x: parameters.validation_points[i],
                y: Math.sin(parameters.validation_points[i])+parameters.validation_noise[i]
            });
        }
        curve_plotter.plot_points(training_points_data, "red", "red", 4, 1);
        curve_plotter.plot_points(validation_points_data, "teal", "teal", 4, 1);
    }

    function plot_train_posterior() {
        var color = d3.scaleLog()
            .domain([1,100])
            .interpolate(function() { return d3.interpolateSpectral; });
        var contours = d3.contours()
            .size([parameters.n, parameters.m])
            .thresholds(d3.range(0.01, 500, .5));

        var new_data = new Array(parameters.n*parameters.m);
        for (var i = 0; i < train_posterior_data.length; i++) {
            new_data[i] = train_posterior_data[i] * parameters.validation_points.length / parameters.train_points.length;
        }

        train_posterior_plotter.plot_contour(
            data=new_data,
            n=parameters.n,
            m=parameters.m,
            color_scale=color,
            contour_scale=contours
        );
    }

    function get_train_posterior(dummy_net, w_1, w_2) {
        var total_loss = 0;
        var predicted;
        var true_label;
        var x_val;
        dummy_net.getLayer(1).setWeights([[w_1], [w_2]]);
        for (var i = 0; i < parameters.train_points.length; i++) {
            x_val = new net_lib.Vol([parameters.train_points[i]]);
            true_label = Math.sin(parameters.train_points[i]) + parameters.train_noise[i];
            predicted = dummy_net.forward(x_val).w[0];
            total_loss += (true_label - predicted) * (true_label - predicted);
        }
        return total_loss;
    }

    return {
        plot: plot,
        sample_train: sample_train,
        reset: reset
    };
}
