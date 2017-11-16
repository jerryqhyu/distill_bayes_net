function Plotter(svg, domain_x, domain_y, width, height) {

    // svg properties
    var svg = svg;
    var domain_x = domain_x;
    var domain_y = domain_y;
    var width = width;
    var height = height;
    var step_size = 0.1;

    // scales from domain/range to width/height of the svg
    var x_scale = d3.scaleLinear().domain(domain_x).range([0, width]);
    var y_scale = d3.scaleLinear().domain(domain_y).range([height, 0]);
    x_scale.clamp(true);
    y_scale.clamp(true);

    // a line scale
    var line = d3.line().x(function(d) {
        return x_scale(d.x);
    }).y(function(d) {
        return y_scale(d.y);
    })

    function plot_line(data, options) {
        var options = options || {};
        var color = typeof(options.color) === 'undefined'
            ? "black"
            : options.color
        var fill = typeof(options.fill) === 'undefined'
            ? "none"
            : options.fill
        var width = typeof(options.width) === 'undefined'
            ? 1
            : options.width
        var opacity = typeof(options.opacity) === 'undefined'
            ? 1
            : options.opacity
        var id = typeof(options.id) === 'undefined'
            ? ""
            : options.id
        if (id) {
            svg.select(id).append('path').attr('d', line(data)).attr('stroke', color).attr('stroke-width', width).attr('fill', fill).attr("opacity", opacity)
        } else {
            svg.append('path').attr('d', line(data)).attr('stroke', color).attr('stroke-width', width).attr('fill', fill).attr("opacity", opacity)
        }
    }

    function plot_points(data, options) {
        // stroke = "black", color = "black", size = 3, opacity = 1, on_drag, dragging, end_drag
        var options = options || {};
        var stroke = typeof(options.stroke) === 'undefined'
            ? "none"
            : options.stroke
        var color = typeof(options.color) === 'undefined'
            ? "black"
            : options.color
        var size = typeof(options.size) === 'undefined'
            ? 2
            : options.size
        var opacity = typeof(options.opacity) === 'undefined'
            ? 1
            : options.opacity
        var id = typeof(options.id) === 'undefined'
            ? ""
            : options.id
        var on_drag = typeof(options.on_drag) === 'undefined'
            ? undefined
            : options.on_drag
        var dragging = typeof(options.dragging) === 'undefined'
            ? undefined
            : options.dragging
        var end_drag = typeof(options.end_drag) === 'undefined'
            ? undefined
            : options.end_drag
        var mouseover = typeof(options.mouseover) === 'undefined'
            ? undefined
            : options.mouseover
        var mouseout = typeof(options.mouseout) === 'undefined'
            ? undefined
            : options.mouseout

        for (var i = 0; i < data.length; i++) {
            if (id) {
                svg.select(id).append("circle").attr("cx", x_scale(data[i].x)).attr("cy", y_scale(data[i].y)).attr("r", size).attr("stroke", stroke).attr("fill", color).attr("opacity", opacity).on("mouseover", mouseover).on("mouseout", mouseout).call(d3.drag().on("start", on_drag).on("drag", dragging).on("end", end_drag));
            } else {
                svg.append("circle").attr("cx", x_scale(data[i].x)).attr("cy", y_scale(data[i].y)).attr("r", size).attr("stroke", stroke).attr("fill", color).attr("opacity", opacity).on("mouseover", mouseover).on("mouseout", mouseout).call(d3.drag().on("start", on_drag).on("drag", dragging).on("end", end_drag));
            }
        }
    }

    function plot_contour(data, options) {
        //contour is a marching square, we have to scale the squares to svg size
        // n, m, color_scale, contour_scale, id, opacity, stroke
        var options = options || {};
        var n = typeof(options.n) === 'undefined'
            ? 0
            : options.n
        var m = typeof(options.m) === 'undefined'
            ? 0
            : options.m
        var color_scale = typeof(options.color_scale) === 'undefined'
            ? null
            : options.color_scale
        var contour_scale = typeof(options.contour_scale) === 'undefined'
            ? null
            : options.contour_scale
        var id = typeof(options.id) === 'undefined'
            ? ""
            : options.id
        var opacity = typeof(options.opacity) === 'undefined'
            ? 1
            : options.opacity
        var stroke = typeof(options.stroke) === 'undefined'
            ? "none"
            : options.stroke

        if (id) {
            size_multiplier = width / n;
            svg.select(id).selectAll("path").data(contour_scale(data)).enter().append("path").attr("d", d3.geoPath(d3.geoIdentity().scale(size_multiplier))).attr("fill", function(d) {
                return color_scale(d.value);
            }).attr("opacity", opacity).attr("stroke", stroke);
        } else {
            size_multiplier = width / n;
            svg.selectAll("path").data(contour_scale(data)).enter().append("path").attr("d", d3.geoPath(d3.geoIdentity().scale(size_multiplier))).attr("fill", function(d) {
                return color_scale(d.value);
            }).attr("opacity", opacity);
        }
    }

    function add_group(name) {
        svg.append("g").attr("id", name);
    }

    function add_x_axis_label(t) {
        svg.append("text").attr("transform", "translate(" + (
        width / 2) + " ," + (
        height + 15) + ")").style("text-anchor", "middle").attr("color", "grey").attr("opacity", 0.3).text(t);
    }

    function add_y_axis_label(t) {
        svg.append("text").attr("transform", "translate(" + (
        width + 15) + "," + (
        height / 2) + ")rotate(-90)").style("text-anchor", "middle").attr("color", "grey").attr("opacity", 0.3).text(t);
    }

    return {
        plot_line: plot_line,
        plot_points: plot_points,
        plot_contour: plot_contour,
        add_group: add_group,
        add_x_axis_label: add_x_axis_label,
        add_y_axis_label: add_y_axis_label
    };
}
