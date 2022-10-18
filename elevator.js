const Direction = {
    Idle: 'Idle',
    Up: 'Up',
    Down: 'Down'
};

const ElevatorStatus = {
    Moving: 'Moving',
    Stopped: 'Stopped'
};

time = 200;
timeout = ms => new Promise(resolve => setTimeout(resolve, ms));

class App {
    constructor() {
        this.waitlist = [];
        this.maxFloors = 10;

        this.elevator = new Elevator(1, this.maxFloors);

        this.elevator.alertReset = this.processWaitlist;
    }

    floorRequest = (direction, floor) => {
        if(this.elevator.queueDirection == Direction.Idle || direction == this.elevator.queueDirection){
            console.log(`🟡 Floor ${floor} requested to go ${direction}`);
            this.elevator.updateQueue(floor, direction);
        }else{
            this.waitlist.push(floor);
        }
    };

    elevatorRequest = (floor) => {
        //console.log('this.elevator.queueDirection', this.elevator.queueDirection);
        console.log(`🟢 Elevator requested floor ${floor}`);
        const relativeDirection = this.elevator.getTargetTravelDirection(floor);
        /*
            check the distance between the current floor and each requested floor

            this.elevator.destinationFloor
            this.elevator.currentFloor
            
            if(Math.abs(this.elevator.currentFloor-floor) > Math.abs(this.elevator.destinationFloor-floor))
        */

        if(Math.abs(this.elevator.currentFloor-floor) < Math.abs(this.elevator.destinationFloor-floor)){
            this.elevator.queueDirection = this.elevator.getTargetTravelDirection(floor);
            this.elevator.updateQueue(floor);
        }else if(relativeDirection == this.elevator.queueDirection){
            this.elevator.updateQueue(floor);
        }else{
            this.waitlist.push(floor);
        }
    };

    addToWaitlist = (floor) => {
        this.waitlist.push(floor);
    }

    processWaitlist = (elevatorFloorLocation) => {
        console.log('waitlist:', this.waitlist);
        if(this.waitlist.length > 0){
            console.log(`processing waitlist. elevator currently at floor ${elevatorFloorLocation}`);
            this.waitlist.forEach((floor) => {
                this.elevator.updateQueue(floor);
            })
            this.waitlist = [];
        }   
    }
}

class Elevator {
    constructor(id, maxFloors) {
        this.id = id;
        this.maxFloors = maxFloors;
        this.minFloors = 1;
        this.currentFloor = 1;
        this.destinationFloor = 1;
        this.currentTravelDirection = Direction.Idle;
        this.status = ElevatorStatus.Stopped;
        this.queue = [];
        this.queueDirection = Direction.Idle;
        this.alertReset = () => {};
    }

    #checkFloorBoundaries = (floor) => {
        const isWithinBoundaries = floor <= this.maxFloors && floor >= this.minFloors

        if(isWithinBoundaries){
            return isWithinBoundaries;
        }else{
            throw new Error(`requested floor is outside the boundaries (${this.minFloors}, ${this.maxFloors}): ${floor}`);
        }
    }

    getTargetTravelDirection = (floor) => {
        return floor > this.currentFloor ? Direction.Up : Direction.Down;
    }

    #travelToDestinationFloor = async () => {
        await timeout(time);

        //console.log('this.destinationFloor', this.destinationFloor);
        //console.log('this.queue', this.queue);

        const i = this.currentTravelDirection == Direction.Up ? 1 : -1;

        this.currentFloor = this.currentFloor+i;
        
        if(this.#checkFloorBoundaries(this.currentFloor)){
            if(this.currentFloor == this.destinationFloor){
                console.log(`🎉 Elevator has arrived at floor ${this.currentFloor}`);
                this.#removeFromQueue();

                if(this.queue.length > 0){
                    this.currentTravelDirection = this.queueDirection;
                    this.destinationFloor = this.queue[0];
                    this.#travelToDestinationFloor();
                }else{
                    this.#reset();
                }
            }else{
                console.log(`🛗  Elevator is at floor ${this.currentFloor}`);
                this.#travelToDestinationFloor();
            }
        }
    }

    sortByDirection = (a, b) => {
        if(this.queueDirection == Direction.Up) {
            return a-b;
        }else if(this.queueDirection == Direction.Down){
            return b-a;
        }
        
        return 0;
    }

    #addToQueue = (floor) => {
        if(floor != this.currentFloor){
            this.queue.push(floor);
            this.queue.sort(this.sortByDirection);
        }
    }

    #removeFromQueue = () => {
        this.queue.shift();
    }

    updateQueue = (floor, direction = Direction.Idle) => {
        //console.log('elevator status', this.status);
        if(this.#checkFloorBoundaries(floor)){
            if(this.queueDirection == Direction.Idle) this.queueDirection = direction;
            this.#addToQueue(floor);

            if(this.status == ElevatorStatus.Stopped){
                this.currentTravelDirection = this.getTargetTravelDirection(floor);
                this.destinationFloor = floor;
                this.status = ElevatorStatus.Moving;

                this.#travelToDestinationFloor();
            }else if(this.status == ElevatorStatus.Moving){
                this.destinationFloor = this.queue[0];
            }
        }
    }; 

    #reset = () => {
        this.queue = [];
        this.queueDirection = Direction.Idle;
        this.currentTravelDirection = Direction.Idle;
        this.status = ElevatorStatus.Stopped;
        this.alertReset(this.currentFloor);
    }

}

const app = new App();

const testElevator = (async () => {
    app.floorRequest(Direction.Up, 8);

    await timeout(time);

    app.floorRequest(Direction.Up, 3);

    await timeout(time);

    app.elevatorRequest(2);
    app.elevatorRequest(5);

    await timeout(time*6);

    app.elevatorRequest(10);

    // await timeout(time*7);

    // app.elevatorRequest(2);

    // app.floorRequest(Direction.Down, 3);

    // await timeout(time);

    // app.floorRequest(Direction.Down, 10);

    // await timeout(time*9);

    // app.elevatorRequest(1);

    // await timeout(time*7);

    // app.elevatorRequest(2);
    
})();