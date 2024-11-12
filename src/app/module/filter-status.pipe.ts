import { Pipe, PipeTransform } from '@angular/core';
import { Task } from '../models/task.model';

@Pipe({
  name: 'filterStatus',
  pure: false //Verinin değişimini algılamak için pure=false yapıldı.
})
export class FilterStatusPipe implements PipeTransform {

  transform(tasks: Task[], status: 'TODO' | 'IN_PROGRESS' | 'DONE'): Task[] {
    if (!tasks) return [];
    return tasks.filter(task => task.status === status);
  }

}