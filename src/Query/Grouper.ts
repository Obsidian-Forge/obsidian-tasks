import type { Task } from '../Task';
import { Group } from './Group';

/**
 * A naming function, that takes a Task object and returns the corresponding group property name
 */
export type GrouperFunction = (task: Task) => string[];

export type GroupingProperty =
    | 'backlink'
    | 'done'
    | 'due'
    | 'filename'
    | 'folder'
    | 'happens'
    | 'heading'
    | 'path'
    | 'priority'
    | 'recurrence'
    | 'recurring'
    | 'root'
    | 'scheduled'
    | 'start'
    | 'status'
    | 'tags';

export class Grouper {
    public readonly grouper: GrouperFunction;

    private constructor(grouper: GrouperFunction) {
        this.grouper = grouper;
    }

    public static fromGroupingProperty(property: GroupingProperty): Grouper {
        return new Grouper(Group.grouperForProperty(property));
    }
}
