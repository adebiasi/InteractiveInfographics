class SpatialOperations {

    static toMap(latlng) {
        return [map(latlng[1], -180, 180, 0, width), map(latlng[0], -90, 90, height, 0)];
    }

    static toGrid(ind, numCols, numRows, cellWidth, cellHeight, offsetX = 0, offsetY = 0, inverse = false) {
        let i = ind % numCols;
        let j = int(ind / numCols) % numRows;
        if (!inverse) {
            return [offsetX + i * cellWidth, offsetY + j * cellHeight];
        } else {
            return [offsetX - i * cellWidth-cellWidth, offsetY - j * cellHeight-cellHeight];
        }
    }

    static moveToTarget(point, destination, velocity) {
        let direction = p5.Vector.sub(destination, point);
        direction.normalize(); // Normalize the vector to get a unit direction
        direction.mult(velocity); // Multiply the direction by the velocity

        if (point.dist(destination) > velocity) {
            // Move the point along the calculated direction
            point.add(direction);
        } else return [destination.x, destination.y];

        return [point.x, point.y];
    }

    static praceToSpiral(i, size, center, maxRadius) {
        // console.log(center)
        // let maxRadius = 10;
        let centerX = center.x;
        let centerY = center.y;
        let angleIncrement = TWO_PI / 90;
        // let angle = angleIncrement * i;
        // for (let i = 0; i < numCircles; i++) {
        //  let radius = (i / size) * (maxRadius);
        // let radius = (i / 40);
        let radius = (i / (TWO_PI * 2));
        // let x = centerX + radius * cos(angle);
        //  let y = centerY + radius * sin(angle);
        let x = centerX + radius * cos(i * angleIncrement);
        let y = centerY + radius * sin(i * angleIncrement);
        //     ellipse(x, y, 5, 5);
        //    angle += angleIncrement; // Increment the angle to evenly distribute the circles.
        //  }
        return [x, y];
        //  }
    }
}