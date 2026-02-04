import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'phone',
  standalone: true
})
export class PhonePipe implements PipeTransform {
  transform(value: string | undefined | null): string {
    if (!value) return '';
    
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Formata conforme o tamanho
    if (numbers.length <= 10) {
      // Formato: (99) 9999-9999
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      // Formato: (99) 99999-9999
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  }
}
