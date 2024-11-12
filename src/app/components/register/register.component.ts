import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service'; 
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  username: string = '';
  email: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  register() {
    this.authService.register(this.username, this.email, this.password).subscribe({
      next: () => {
        alert('Kayıt başarılı!');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error(err);
        alert('Kayıt sırasında bir hata oluştu.');
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
