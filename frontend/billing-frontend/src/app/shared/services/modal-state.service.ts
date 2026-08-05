import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ModalStateService {
  private modalOpenSubject = new BehaviorSubject<boolean>(false);
  modalOpen$: Observable<boolean> = this.modalOpenSubject.asObservable();

  open(): void {
    this.modalOpenSubject.next(true);
  }

  close(): void {
    this.modalOpenSubject.next(false);
  }
}
