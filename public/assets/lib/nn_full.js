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

    //define a neural network 3*3
    var layer_defs = [];
    layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:1});
    layer_defs.push({type:'fc', num_neurons:3, activation:'tanh'});
    layer_defs.push({type:'regression', num_neurons:1});
    var net = new convnetjs.Net();
    net.makeLayers(layer_defs);
    var trainer = new convnetjs.Trainer(net, {method: 'adadelta', batch_size: 50});

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
        console.log(pred);
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
    }

    function train() {
        drawLine();
        setInterval(train_epoch, 10);
    }

    function train_epoch() {
        var x;
        for (var i = -5; i < 5; i+=step_size) {
            x = new convnetjs.Vol([i]);
            trainer.train(x, [Math.sin(i)]);
        }
        svg.selectAll("*").remove();
        drawLine();
    }

    return {
        train: train,
        draw_line: drawLine,
    };
}
