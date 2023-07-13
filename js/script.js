const EDUCATION_DATA = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json';
const COUNTRY_DATA = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json';


Promise.all([d3.json(COUNTRY_DATA), d3.json(EDUCATION_DATA)])
  .then(data => ready(data[0], data[1]))
  .catch(err => console.log(err));

function ready(country, education) {

  // Define the div for the tooltip
  var tooltip = d3
  .select('body')
  .append('div')
  .attr('class', 'tooltip')
  .style('opacity', 0);

  // Add title to the page
  var title = d3
    .select('#main')
    .append('h1')
    .attr('id', 'title')
    .text('US Educational');

  var desc = d3
    .select('#main')
    .append('div')
    .attr('id', 'description')
    .text("bachelor's degree or higher");  

  var svg = d3
    .select('#main')
    .append('svg')
    .attr('width', 960)
    .attr('height', 600)

  var eduThreshold = [];
  education.forEach(function (val) {
    eduThreshold.push(val.bachelorsOrHigher);
  });
  var minThreshold = Math.min.apply(null, eduThreshold);
  var maxThreshold = Math.max.apply(null, eduThreshold);

  var color = d3
  .scaleThreshold()
  .domain(d3.range(minThreshold, maxThreshold, (maxThreshold - minThreshold) / 4))
  .range(d3.schemeBlues[5]);
  
  // set the x-axis range for the legend bar
  var legendX = d3.scaleLinear().domain([minThreshold, maxThreshold]).rangeRound([380, 650]);

  var legendSVG = svg
  .append('g')
  .attr('id', 'legend')
  .attr('transform', 'translate(0,10)');

  legendSVG.selectAll('rect')
    .data(
      color.range().map(function (d) {
        d = color.invertExtent(d);
        if (d[0] === null) {
          d[0] = legendX.domain()[0];
        }
        if (d[1] === null) {
          d[1] = legendX.domain()[1];
        }
        return d;
      })
    )
    .enter()
    .append('rect')
    .attr('height', 10)
    .attr('x', function (d) {
      return legendX(d[0]);
    })
    .attr('width', function (d) {
      return d[0] && d[1] ? legendX(d[1]) - legendX(d[0]) : legendX(null);
    })
    .attr('fill', function (d) {
      return color(d[0]);
    });

    legendSVG.append('text')
      .attr('x', legendX.range()[0])
      .attr('y', -6)
      .attr('fill', '#000')
      .attr('text-anchor', 'start')
      .attr('font-weight', 'bold');

    legendSVG.call(
      d3
        .axisBottom(legendX)
        .tickSize(15)
        .tickFormat(function (x) {
          return Math.round(x) + '%';
        })
        .tickValues(color.domain())
    )
      .select('.domain')
      .remove();

  svg
    .append('g')
    .selectAll('path')
    .data(topojson.feature(country, country.objects.counties).features)
    .enter()
    .append('path')
    .attr('class', 'county')
    .attr('data-fips', function (d) {
      return d.id;
    })
    .attr('data-education', function (d) {
      var result = education.filter(function (obj) {
        return obj.fips === d.id;
      });
      if (result[0]) {
        return result[0].bachelorsOrHigher;
      }
      // could not find a matching fips id in the education data
      console.log('could not find education data for fips: ', d.id);
      return 0;
    })
    .attr('fill', function (d) {
      var result = education.filter(function (obj) {
        return obj.fips === d.id;
      });
      if (result[0]) {
        return color(result[0].bachelorsOrHigher);
      }
      // could not find a matching fips id in the education data
      return color(0);
    })
    .attr('d', d3.geoPath())
    .on('mouseover', function (event, d) {
      tooltip.style('opacity', 1.0);

      var result = education.filter(function (obj) {
              return obj.fips === d.id;
          });
      tooltip
        .attr('id', 'tooltip')
        .html(function(){
          if (result[0]) {
            return (
              'State: ' + result[0]['state'] +
              '<br/> ' +
              'Area: ' + result[0]['area_name'] +
              '<br/> ' +
              'Bachelor or Higher: ' + result[0].bachelorsOrHigher +
              '%'
            );
          }  
          return 0;
        })
        .attr('data-education', function () {
          if (result[0]) {
            return result[0].bachelorsOrHigher;
          }
          // could not find a matching fips id in the data
          return 0;
        })
        .style('left', event.pageX + 15 + 'px')
        .style('top', event.pageY - 20 + 'px');
    })
    .on('mouseout', function() {
      tooltip.style('opacity', 0);
    });
  
  // Make the States lines appear on the map.
  svg
    .append('path')
    .datum(
      topojson.mesh(country, country.objects.states, function (a, b) {
        return a !== b;
      })
    )
    .attr('class', 'states')
    .attr('d', d3.geoPath());
  
}