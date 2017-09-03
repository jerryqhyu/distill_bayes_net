function nn_full(div) {

    var w = 984
    var h = 300
    var xScale = d3.scaleLinear().domain([-5,5]).range([0,w])
    var yScale = d3.scaleLinear().domain([-2,2]).range([h,0])
    var line_true = d3.line()
    .x(function(d) {
        return xScale(d.x);
    })
    .y(function(d) {
        return yScale(d.y);
    })
    var line_predicted = d3.line()
    .x(function(d) {
        return xScale(d.x);
    })
    .y(function(d) {
        return yScale(d.y);
    })
    var train_points = [-2.9, -2.7, -2.5, -2.3, -2.1, -1.9, -1.7, -1.5, -1.3, -1.1, -0.9, -0.7, -0.5, -0.3, -0.1, 0.1,
        0.3, 0.5, 0.7, 0.9, 1.1, 1.3, 1.5, 1.7, 1.9, 2.1, 2.3, 2.5, 2.7, 2.9];
    var noise = [ 0.10408689,  0.10999347, -0.21092732,  0.21040211, -0.05441124,
        0.32326489, -0.25552701, -0.47457946,  0.02745911,  0.10275629,
        0.22240206,  0.52373514,  0.18365871,  0.07530947, -0.29227835,
        0.18867107,  0.52420313,  0.04456809, -0.24384817,  0.40080137,
        0.26032293,  0.05870727, -0.02125257, -0.12151286, -0.02832058,
        0.03619698, -0.00548018, -0.18057678,  0.23171462,  0.31800257];

    //define a neural network 3*3
    var layer_defs = [];
    layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:1});
    layer_defs.push({type:'fc', num_neurons:4, activation:'tanh'});
    layer_defs.push({type:'fc', num_neurons:4, activation:'tanh'});
    layer_defs.push({type:'fc', num_neurons:4, activation:'tanh'});
    layer_defs.push({type:'regression', num_neurons:1});
    var net = new convnetjs.Net();
    net.makeLayers(layer_defs);
    var trainer = new convnetjs.Trainer(net, {method: 'adadelta', batch_size: 10});

    // var trainer = new convnetjs.Trainer(net, {method: 'sgd', learning_rate: 0.05,
    // l2_decay: 0, momentum: 0.9, batch_size: 50,
    // l1_decay: 0});


    var step_size = 0.1;
    var div = div;
    var intDiv = div.style("width", w + "px")
    .style("height", h + "px")
    div.selectAll("svg").data([0]).enter().append("svg");
    var svg = div.selectAll("svg").data([0]);
    svg.attr("width", w)
    .attr("height", h)

    function get_points() {
        var data = {};
        var real = [];
        var pred = [];
        var predicted_value;
        var x_val;
        for (var i = -20; i < 20; i+=step_size) {
            real.push({x:i,y:Math.sin(i)});
            x_val = new convnetjs.Vol([i]);
            var predicted_value = net.forward(x_val);
            pred.push({x:i,y:predicted_value.w[0]});
        }
        data.real = real;
        data.pred = pred;
        return data;
    }

    function drawLine() {
        data = get_points();
        svg.append('path')
        .attr('d', line_true(data.real))
        .attr('stroke', "black")
        .attr('stroke-width', 2)
        .attr('fill', "none")
        svg.append('path')
        .attr('d', line_predicted(data.pred))
        .attr('stroke', "red")
        .attr('stroke-width', 2)
        .attr('fill', "none")
        for (var j = 0; j < train_points.length; j++) {
            svg.append("circle")
            .attr("cx", xScale(train_points[j]))
            .attr("cy", yScale(Math.sin(train_points[j])+noise[j]))
            .attr("r", 2)
            .attr("fill", "red");
        }
    }

    function train() {
        drawLine();
        setInterval(train_epoch, 10);
    }

    function train_epoch() {
        var x;
        for (var j = 0; j < train_points.length; j++) {
            x = new convnetjs.Vol([train_points[j]]);
            trainer.train(x, [Math.sin(train_points[j])+noise[j]]);
        }
        svg.selectAll("*").remove();
        drawLine();
    }

    return {
        train: train,
        draw_line: drawLine,
    };
}
