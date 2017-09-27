//Supports all plotting functionalities
function Plotter(svg, domain_x, domain_y, width, height) {

    //svg properties
    var svg = svg;
    var domain_x = domain_x;
    var domain_y = domain_y;
    var width = width;
    var height = height;
    var step_size = 0.1;

    //scales from domain/range to width/height of the svg
    var x_scale = d3.scaleLinear().domain(domain_x).range([0,width]);
    var y_scale = d3.scaleLinear().domain(domain_y).range([height,0]);
    var x_scale_inverse = d3.scaleLinear().domain([0, width]).range(domain_x);
    var y_scale_inverse = d3.scaleLinear().domain([height,0]).range(domain_y);

    //a line plotter
    var line = d3.line()
    .x(function(d) {
        return x_scale(d.x);
    })
    .y(function(d) {
        return y_scale(d.y);
    })

    function plot_line(data, color, width, opacity) {
        if (typeof(opacity) === 'undefined') {
            opacity = 1;
        }
        svg.append('path')
        .attr('d', line(data))
        .attr('stroke', color)
        .attr('stroke-width', width)
        .attr('fill', "none")
        .attr("opacity", opacity);
    }

    function plot_points(data, color, size, opacity, on_drag, dragging, end_drag) {
        if (typeof(opacity) === 'undefined') {
            opacity = 1;
        }
        for (var i = 0; i < data.length; i++) {
            svg.append("circle")
            .attr("cx", x_scale(data[i].x))
            .attr("cy", y_scale(data[i].y))
            .attr("r", size)
            .attr("fill", color)
            .attr("opacity", opacity)
            .call(d3.drag()
                .on("start", on_drag)
                .on("drag", dragging)
                .on("end", end_drag));
        }
    }

    function plot_contour(data, n, m, color_scale, contour_scale) {
        //contour is a marching square, we have to scale the squares to svg size
        size_multiplier = width/n;
        svg.selectAll("path")
            .data(contours(data))
            .enter().append("path")
            .attr("d", d3.geoPath(d3.geoIdentity().scale(size_multiplier)))
            .attr("fill", function(d) {
                return color_scale(d.value);
            });
    }

    return {
        plot_line: plot_line,
        plot_points: plot_points,
        plot_contour: plot_contour
    };
}
