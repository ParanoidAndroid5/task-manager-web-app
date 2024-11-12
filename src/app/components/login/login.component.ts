import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  username: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        console.log('Giriş sonrası sessionStorage:', sessionStorage.getItem('username')); // Debug için
        alert('Giriş başarılı!');
        this.router.navigate(['/projects']); 
      },
      error: (err) => {
        console.error(err);
        alert('Giriş bilgileri hatalı.');
      }
    });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}
