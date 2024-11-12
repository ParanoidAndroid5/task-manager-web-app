import { Component, OnInit } from '@angular/core';
import { ProjectService } from 'src/app/services/project.service'; 
import { Project } from 'src/app/models/project.model'; 
import { Router } from '@angular/router'

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss']
})
export class ProjectsComponent implements OnInit {

  projects: Project[] = [];

  constructor(private projectService: ProjectService, private router: Router) { }

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.projectService.getProjects().subscribe({
      next: (data) => {
        this.projects = data;
      },
      error: (err) => {
        console.error('Projeleri yüklerken hata oluştu', err);
      }
    });
  }

  selectProject(project: Project): void {
    sessionStorage.setItem('selectedProjectId', project.id.toString());
    this.router.navigate(['/dashboard']);
  }
}
