import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { FormsModule } from '@angular/forms'; // <-- NgModel lives here

declare var $: any;

interface Calculator{
  mode: string;
  side: string;
  symbol: string;
  oriBalanceUsdt: number;
  feePercent: number;
}

interface Symbols {
	symbols: string[];
}

interface PercentLoss {
	percentLoss: number;
}

@Component({
  selector: 'app-calculator',
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.css']
})

export class CalculatorComponent implements OnInit {

  public myMath = Math;

  symbol_a: Symbols = {
    symbols: ["BTCUSDT","ETHUSDT","XMRUSDT"]
  };
  
  
  calculator: Calculator = {
    mode: 'instant',
    side: '',
    symbol: '',
    oriBalanceUsdt: 0,
    feePercent: 0.04
  };

  percentLoss: PercentLoss = {
    percentLoss: 0
  };


  get_symbol_url: string = 'http://localhost:3001/api/getSymbols';
  get_percent_loss_url: string = 'http://localhost:3001/api/calcFuturesActualFeePercent';

  constructor(private http: HttpClient) {

  }

   delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms));
  }

  getSymbol_a() {
    let x = this.http.get<string>(this.get_symbol_url, {observe: 'body', responseType: 'json'});
    x.subscribe((data: any) => this.symbol_a = data);//(data: any) => this.symbol_a = data
    
  }

  getPercentLoss() {
    let queries = {
      mode: this.calculator.mode,
      side: this.calculator.side,
      symbol: this.calculator.symbol,
      oriBalanceUsdt: this.calculator.oriBalanceUsdt,
      feePercent: this.calculator.feePercent
    };
    let x = this.http.get<string>(this.get_percent_loss_url, {params: queries, observe: 'body', responseType: 'json'});
    x.subscribe((data: any) => this.percentLoss = data);
  }

  formatLabel(value: number) {
    return '$' + Math.round(value / 100)/10 + 'k';
  }

  //$('.selectpicker').selectpicker('refresh');

  async ngOnInit(): Promise<void> {
    this.getSymbol_a();
    let currentSymbol = this.symbol_a;
    for(let i = 0; i<100; i++){
      if(currentSymbol != this.symbol_a){
        $('.selectpicker').selectpicker('refresh');
        break;
      }
      await this.delay(100);
    }
  }

  //ngAfterViewInit() {
  //  $('.selectpicker').find('[value=ETHUSDT]').remove();
  //  $('.selectpicker').selectpicker('refresh');
  //}
  

}

