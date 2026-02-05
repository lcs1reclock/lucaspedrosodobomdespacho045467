import { Directive, HostListener, ElementRef } from '@angular/core';

@Directive({
  selector: '[appIntegerOnly]',
  standalone: true
})
export class IntegerOnlyDirective {
  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Remove tudo que não é número
    let value = input.value.replace(/\D/g, '');
    
    // Se começar com 0, remove (exceto se for só 0)
    if (value.length > 1 && value.startsWith('0')) {
      value = value.replace(/^0+/, '');
    }
    
    input.value = value;
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    const key = event.key;
    
    // Permite: backspace, delete, tab, escape, enter, setas
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) {
      return;
    }
    
    // Permite Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(key.toLowerCase())) {
      return;
    }
    
    // Bloqueia se não for número (0-9)
    if (!/^\d$/.test(key)) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    // Remove tudo que não é número
    const numbers = pastedText.replace(/\D/g, '');
    
    const input = event.target as HTMLInputElement;
    input.value = numbers;
    input.dispatchEvent(new Event('input'));
  }
}
