declare module 'ical.js' {
  export function parse(input: string): any;
  
  export class Component {
    constructor(jCal: any);
    getAllSubcomponents(name: string): Component[];
    getFirstProperty(name: string): Property | null;
    getAllProperties(name: string): Property[];
  }
  
  export class Event {
    constructor(component: Component);
    uid: string;
    summary: string;
    description: string;
    location: string;
    startDate: Time | null;
    endDate: Time | null;
  }
  
  export class Property {
    getFirstValue(): any;
  }
  
  export class Time {
    toJSDate(): Date;
  }
}