import { Directive, HostListener, ElementRef } from '@angular/core';

@Directive({
  selector: '[appPhoneMask]',
  standalone: true
})
export class PhoneMaskDirective {
  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Remove tudo que não é número
    
    // Limita a 11 dígitos
    if (value.length > 11) {
      value = value.substring(0, 11);
    }
    
    // Aplica a máscara
    let formatted = '';
    if (value.length > 0) {
      formatted = '(' + value.substring(0, 2);
      if (value.length >= 3) {
        formatted += ') ' + value.substring(2, 7);
      }
      if (value.length >= 8) {
        formatted += '-' + value.substring(7, 11);
      }
    }
    
    input.value = formatted;
    
    // Dispara evento para atualizar o ngModel
    input.dispatchEvent(new Event('input'));
  }

  @HostListener('blur', ['$event'])
  onBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    const numbers = input.value.replace(/\D/g, '');
    
    // Se tiver números mas não estiver completo, formata o que tem
    if (numbers.length > 0 && numbers.length < 10) {
      // Telefone incompleto - mantém o que foi digitado
      let formatted = '';
      if (numbers.length >= 2) {
        formatted = '(' + numbers.substring(0, 2);
        if (numbers.length > 2) {
          formatted += ') ' + numbers.substring(2);
        }
      } else {
        formatted = numbers;
      }
      input.value = formatted;
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    const key = event.key;
    
    // Permite: backspace, delete, tab, escape, enter
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      return;
    }
    
    // Permite Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(key.toLowerCase())) {
      return;
    }
    
    // Bloqueia se não for número
    if (!/^\d$/.test(key)) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const numbers = pastedText.replace(/\D/g, '').substring(0, 11);
    
    const input = event.target as HTMLInputElement;
    
    // Aplica a máscara aos números colados
    let formatted = '';
    if (numbers.length > 0) {
      formatted = '(' + numbers.substring(0, 2);
      if (numbers.length >= 3) {
        formatted += ') ' + numbers.substring(2, 7);
      }
      if (numbers.length >= 8) {
        formatted += '-' + numbers.substring(7, 11);
      }
    }
    
    input.value = formatted;
    input.dispatchEvent(new Event('input'));
  }
}
