import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service'; 
import { User } from 'src/app/models/user.model'; 
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  currentUser: User = {};
  updatedUser: User = {};
  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  constructor(
    private userService: UserService,
    private router: Router,
    private authService: AuthService 
  ) { }

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.updatedUser = { ...user };
      },
      error: (error) => {
        console.error('Kullanıcı bilgileri alınamadı', error);
        alert('Kullanıcı bilgileri alınamadı.');
      }
    });
  }

  updateProfile(): void {
    if (!this.updatedUser.username || !this.updatedUser.email) {
      alert('Kullanıcı adı ve e-posta boş olamaz.');
      return;
    }

    this.userService.updateUser(this.updatedUser).subscribe({
      next: (user) => {
        alert('Profil başarıyla güncellendi.');
        this.currentUser = user;
        this.updatedUser = { ...user };
      },
      error: (error) => {
        console.error('Profil güncellenemedi', error);
        alert('Profil güncellenemedi.');
      }
    });
  }

  updatePassword(): void {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      alert('Lütfen tüm şifre alanlarını doldurun.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      alert('Yeni şifre ve şifre tekrarı uyuşmuyor.');
      return;
    }

    const passwords = {
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    };

    this.userService.updatePassword(passwords).subscribe({
      next: () => {
        alert('Şifre başarıyla güncellendi. Lütfen tekrar giriş yapın.');
        this.authService.logout(); 
        this.router.navigate(['/login']); 
      },
      error: (error) => {
        console.error('Şifre güncellenemedi', error);
        alert(error.error.error || 'Şifre güncellenemedi.');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
