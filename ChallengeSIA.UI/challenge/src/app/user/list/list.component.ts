import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/user.service';
import { ResponseDto, UserDto } from 'src/models/RegistrationRequestDto';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {
  users: UserDto[] = []; // Lista de usuarios
  selectedUser: UserDto | null = null; // Usuario seleccionado para eliminación
  isDeletePopupOpen = false; // Control de visibilidad del popup

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.getAllUsers(); // Cargar los usuarios al iniciar el componente
  }

  // Obtener todos los usuarios
  getAllUsers(): void {
    console.log('Llamando a getAllUsers');
    this.userService.getAllUsers().subscribe(
      (response: ResponseDto) => {
        if (response.isSuccess) {
          this.users = response.usersResult; // Asignar la lista de usuarios
          console.log('Datos recibidos:', this.users);
        } else {
          console.error('Error en la respuesta:', response.message);
        }
      },
      (error) => {
        console.error('Error al obtener usuarios', error);
      }
    );
  }

  // Actualizar un usuario (edición en la grilla)
  updateUser(user: UserDto): void {
    this.userService.updateUser(user).subscribe(
      () => {
        alert('Usuario actualizado correctamente');
        this.getAllUsers(); // Recargar la lista de usuarios
      },
      (error) => {
        console.error('Error al actualizar el usuario', error);
      }
    );
  }

  // Abrir popup de confirmación de eliminación
  openDeletePopup(user: UserDto): void {
    this.selectedUser = user;
    this.isDeletePopupOpen = true; // Mostrar el popup
  }

  // Cerrar el popup de confirmación
  closeDeletePopup(): void {
    this.isDeletePopupOpen = false;
    this.selectedUser = null; // Limpiar el usuario seleccionado
  }

  // Confirmar la eliminación del usuario
  confirmDeleteUser(): void {
    if (this.selectedUser) {
      this.userService.removeUser(this.selectedUser.email).subscribe(
        () => {
          this.isDeletePopupOpen = false;
          this.users = this.users.filter(u => u.email !== this.selectedUser?.email); // Eliminar localmente
          this.selectedUser = null;
          alert('Usuario eliminado correctamente');
        },
        (error) => {
          console.error('Error al eliminar el usuario', error);
        }
      );
    }
  }
}
