function nn_full(div) {

    //svg properties
    var w = 684
    var h = 300
    var w_2 = 300
    var h_2 = 300

    //scale for diagram on the left
    var x_scale_left = d3.scaleLinear().domain([-5,5]).range([0,w])
    var y_scale_left = d3.scaleLinear().domain([-2,2]).range([h,0])

    //scale for diagram on the right
    var x_scale_right = d3.scaleLinear().domain([-1,3]).range([0,w_2])
    var y_scale_right = d3.scaleLinear().domain([-2,1]).range([h,0])

    var x_scale_right_inverse = d3.scaleLinear().domain([0, w_2]).range([-1,3])
    var y_scale_right_inverse = d3.scaleLinear().domain([h,0]).range([-2,1])

    var line_true = d3.line()
    .x(function(d) {
        return x_scale_left(d.x);
    })
    .y(function(d) {
        return y_scale_left(d.y);
    })
    var line_predicted = d3.line()
    .x(function(d) {
        return x_scale_left(d.x);
    })
    .y(function(d) {
        return y_scale_left(d.y);
    })

    //hard coded points for consistentcy
    var train_points = [-2.9, -2.7, -2.5, -2.3, -2.1, -1.9, -1.7, -1.5, -1.3, -1.1, -0.9, -0.7, -0.5, -0.3, -0.1, 0.1,
        0.3, 0.5, 0.7, 0.9, 1.1, 1.3, 1.5, 1.7, 1.9, 2.1, 2.3, 2.5, 2.7, 2.9];
    var validation_points = [-1.01021662, -1.00600723,  0.25150535, -0.64289366, -2.83217944,
       -1.27447894,  0.72586946,  1.96606265, -2.32743642, -0.43405676,
        1.30609116,  1.31220319,  2.52755886,  0.49622151,  2.37028589,
       -2.05782618,  1.05461402,  1.33289417, -1.96113098, -0.38732774];
    var noise_train = [ 0.10408689,  0.10999347, -0.21092732,  0.21040211, -0.05441124,
        0.32326489, -0.25552701, -0.47457946,  0.02745911,  0.10275629,
        0.22240206,  0.52373514,  0.18365871,  0.07530947, -0.29227835,
        0.18867107,  0.52420313,  0.04456809, -0.24384817,  0.40080137,
        0.26032293,  0.05870727, -0.02125257, -0.12151286, -0.02832058,
        0.03619698, -0.00548018, -0.18057678,  0.23171462,  0.31800257];
    var noise_validation = [ 0.00282537,  0.14827248,  0.10214164,  0.10019915, -0.28734113,
        0.15081431,  0.06890339,  0.10747714, -0.27386861, -0.43052074,
        0.01162471, -0.08062783,  0.10436563,  0.14189259,  0.3117031 ,
        0.23507118, -0.1050833 ,  0.38510908, -0.02797407,  0.01287228];

    //hard coded optimum value
    var opt_layer1_w = [[0.4192284525818726], [-4.632616835554741], [3.9243368339649196], [3.007595350590139]];
    var opt_layer1_b = [0.7387670254211024, 2.7824153174038213, 0.2444733033082039, 0.501684733161062];
    var opt_layer3_w = [[-2.116031388782301, -0.2678318154538704, -0.32568638911346537, -0.48299422168750644], [0.9719684653689481, -2.915204139102752, 2.389421278369706, 0.7084161317375112], [1.361639935467432, 0.4988850894321718, -0.746099613716224, -0.6611748808451762], [-0.3633784464695688, -4.356958010471985, 0.33555515720941714, 1.7905782720048318]];
    var opt_layer3_b = [0.11184642289580203, -0.8811859534301382, 0.08163456672122071, -0.3890155005638783];
    var opt_layer5_w = [[1.1441634172101276, -0.7957053928418958, -3.741088356272393, -1.0003872580823125], [3.43546769606019, -0.5556880998853753, -0.587307130090077, 0.34996873441168774]];
    var opt_layer5_b = [0.8820188720910388, -0.0033133460236606177];
    var opt_layer7_w = [[1.3540954016648952, -0.9209768713048309]];
    var opt_layer7_b = [0.08352788520153473];

    //define a neural network 3*3
    var net = make_preset_net();
    var epoch = 0;
    var trainer = new convnetjs.Trainer(net, {method: 'adadelta', batch_size: 10});


    // var trainer = new convnetjs.Trainer(net, {method: 'sgd', learning_rate: 0.05,
    // l2_decay: 0, momentum: 0.9, batch_size: 50,
    // l1_decay: 0});

    //diagram parameters
    var step_size = 0.1;
    var div = div;
    var intDiv = div.style("width", w+w_2 + "px")
    .style("height", h + "px")
    var svg = div.append("svg");
    var svg2 = div.append("svg");
    // var svg = div.selectAll("svg").data([0]);
    // var svg2 = div.selectAll("svg").data([1]);
    svg.attr("width", w)
    .attr("height", h);
    svg2.attr("width", w_2)
    .attr("height", h_2);

    plot_total_loss();
    //interval controller
    var interval_id = -1;

    function get_points() {
        var data = {};
        var real = [];
        var pred = [];
        var predicted_value;
        var x_val;
        for (var i = -20; i < 20; i+=step_size) {
            real.push({x:i,y:Math.sin(i)});
            x_val = new convnetjs.Vol([i]);
            predicted_value = net.forward(x_val);
            pred.push({x:i,y:predicted_value.w[0]});
        }
        data.real = real;
        data.pred = pred;
        return data;
    }

    function get_last_two_weights() {
        return net.getLayer(7).filters[0].w;
    }

    function plot_line() {
        data = get_points();
        //sine curve
        svg.append('path')
        .attr('d', line_true(data.real))
        .attr('stroke', "black")
        .attr('stroke-width', 2)
        .attr('fill', "none");

        //NN prediction
        svg.append('path')
        .attr('d', line_predicted(data.pred))
        .attr('stroke', "darkorange")
        .attr('stroke-width', 2)
        .attr('fill', "none")
        .attr('opacity', 0.9);

        //training data points
        for (var j = 0; j < train_points.length; j++) {
            svg.append("circle")
            .attr("cx", x_scale_left(train_points[j]))
            .attr("cy", y_scale_left(Math.sin(train_points[j])+noise_train[j]))
            .attr("r", 3)
            .attr("fill", "red")
            .attr("opacity", 0.7);
        }

        //validation data points
        for (var k = 0; k < validation_points.length; k++) {
            svg.append("circle")
            .attr("cx", x_scale_left(validation_points[k]))
            .attr("cy", y_scale_left(Math.sin(validation_points[k])+noise_validation[k]))
            .attr("r", 3)
            .attr("fill", "teal")
            .attr("opacity", 0.5);
        }
    }

    function plot_weight() {
        weights = get_last_two_weights();
        svg2.append("circle")
        .attr("cx", x_scale_right(weights[0]))
        .attr("cy", y_scale_right(weights[1]))
        .attr("r", 4)
        .attr("fill", "black")
        .attr("opacity", 1)
        .call(d3.drag()
            .on("start", start_drag)
            .on("drag", dragged)
            .on("end", end_drag));
    }

    function start_drag(d) {
        d3.select(this).raise().classed("active", true);
        pause_training();
    }

    function dragged(d) {
        var new_x = d3.event.x;
        var new_y = d3.event.y;
        d3.select(this).attr("cx", new_x).attr("cy", new_y);
        net.getLayer(7).setWeights([[x_scale_right_inverse(new_x), y_scale_right_inverse(new_y)]])
        console.log(d3.event.x);
    }

    function end_drag(d) {
        d3.select(this).raise().classed("active", false);
        train();
    }

    function plot_total_loss() {
        var dummy_net = make_preset_net();
        var color_scale = d3.scaleLinear().domain([0, 1, 3, 15, 30]).range(["darkgreen", "green", "yellow",  "orange", "red"]);
        var x_val;
        var total_loss;
        var true_label;
        var predicted;
        var scaled_width = Math.abs(x_scale_right(0.03) - x_scale_right(0)) + 0.1;
        var scaled_height = Math.abs(y_scale_right(0.03) - y_scale_right(0)) + 0.1;

        for (var w_1 = -1; w_1 < 3; w_1+=0.03) {
            for (var w_2 = -2; w_2 < 1; w_2+=0.03) {
                dummy_net.getLayer(7).setWeights([[w_1, w_2]]);
                total_loss = 0;
                // for (var i = 0; i < train_points.length; i++) {
                //     x_val = new convnetjs.Vol([train_points[i]]);
                //     true_label = Math.sin(train_points[i]) + noise_train[i];
                //     predicted = dummy_net.forward(x_val).w[0];
                //     total_loss += (true_label - predicted) * (true_label - predicted);
                // }
                for (var j = 0; j < validation_points.length; j++) {
                    x_val = new convnetjs.Vol([validation_points[j]]);
                    true_label = Math.sin(validation_points[j]) + noise_validation[j];
                    predicted = dummy_net.forward(x_val).w[0];
                    total_loss += (true_label - predicted) * (true_label - predicted);
                }
                svg2.append("rect")
                .attr("x", x_scale_right(w_1))
                .attr("y", y_scale_right(w_2))
                .attr("width", scaled_width)
                .attr("height", scaled_height)
                .attr("fill", color_scale(total_loss))
                .attr("opacity", 0.7);
            }
        }
    }

    function clear() {
        svg.selectAll("*").remove();
        svg2.selectAll("circle").remove();
    }

    function plot() {
        plot_line();
        plot_weight();
        // plot_total_loss();
    }

    function train() {
        if (interval_id == -1) {
            console.log("started training");
            net.freezeAllButLast();
            interval_id = setInterval(train_epoch, 10);
        }
    }

    function train_epoch() {
        var x;
        for (var j = 0; j < train_points.length; j++) {
            x = new convnetjs.Vol([train_points[j]]);
            trainer.train(x, [Math.sin(train_points[j])+noise_train[j]]);
        }
        // if (epoch === 5000) {
        //     for (var i = 0; i < net.layers.length; i++) {
        //         layer = net.getLayer(i);
        //         if (layer.filters) {
        //             console.log("This is layer" + i);
        //             console.log("Biases");
        //             console.log(layer.biases.w);
        //             for (var j = 0; j < layer.filters.length; j++) {
        //                 console.log(layer.filters[j].w);
        //             }
        //         }
        //     }
        // }

        clear();
        plot();
        epoch++;
    }

    function make_preset_net() {
        var layer_defs = [];
        layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:1});
        layer_defs.push({type:'fc', num_neurons:4, activation:'tanh'});
        layer_defs.push({type:'fc', num_neurons:4, activation:'tanh'});
        layer_defs.push({type:'fc', num_neurons:2, activation:'tanh'});
        layer_defs.push({type:'regression', num_neurons:1});
        var new_net = new convnetjs.Net();
        new_net.makeLayers(layer_defs);
        new_net.getLayer(1).setWeights(opt_layer1_w);
        new_net.getLayer(3).setWeights(opt_layer3_w);
        new_net.getLayer(5).setWeights(opt_layer5_w);
        // net.getLayer(7).setWeights(opt_layer7_w);
        new_net.getLayer(1).setBiases(opt_layer1_b);
        new_net.getLayer(3).setBiases(opt_layer3_b);
        new_net.getLayer(5).setBiases(opt_layer5_b);
        new_net.getLayer(7).setBiases(opt_layer7_b);
        return new_net;
    }

    function pause_training() {
        if (interval_id != -1) {
            clearInterval(interval_id);
            interval_id = -1;
        }
    }

    function reset() {
        net = make_preset_net();
        trainer = new convnetjs.Trainer(net, {method: 'adadelta', batch_size: 10});
        clear();
        plot();
        pause_training();
        epoch = 0;
    }

    return {
        train: train,
        plot: plot,
        reset: reset
    };
}
