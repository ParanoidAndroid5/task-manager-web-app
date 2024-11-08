import { Component } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {//bu kısım backendten gelenlerle güncellenecek

  todo = [
    { title: 'Görev Başlığı 1', description: 'Görev açıklaması...', priority: 'Yüksek' },
    { title: 'Görev Başlığı 2', description: 'Görev açıklaması...', priority: 'Orta' }
  ];

  inProgress = [
    { title: 'Görev Başlığı 3', description: 'Görev açıklaması...', priority: 'Düşük' }
  ];

  done = [
    { title: 'Görev Başlığı 4', description: 'Görev açıklaması...', status: 'Tamamlandı' }
  ];

  drop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } 
    else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }
}
