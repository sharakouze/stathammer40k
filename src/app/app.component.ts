import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { nanoid } from 'nanoid';
import { mean, standardDeviation } from 'simple-statistics';
import { CacheService } from './services/cache.service';
import { IOptions, ITarget, IWeapon, IWeaponResult } from './types/app';
import { IAttackWorkerData } from './types/workers';

const enum CacheKeys {
  Options = 'AppComponent:Options',
  Target = 'AppComponent:Target',
  Weapons = 'AppComponent:Weapons'
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {

  @ViewChild('canvas') private canvas?: ElementRef<HTMLCanvasElement>;

  options = this.cache.get<IOptions>(CacheKeys.Options, {
    simcount: '100000',
    xaxis: '0'
  });
  target = this.cache.get<ITarget>(CacheKeys.Target, {
    toughness: '4',
    armorsave: '3',
    invulsave: '0',
    fnp: '0',
    hitrollmod: '0',
    woundrollmod: '0'
  });
  weapons = this.cache.get<IWeapon[]>(CacheKeys.Weapons, []);

  loading = false;
  results: IWeaponResult[] = [];

  colors = ['CSS_COLOR_NAMES'];

  private chart?: Chart;

  constructor(private cache: CacheService) {
  }

  ngOnInit(): void {
    Chart.register(...registerables);
  }

  ngAfterViewInit(): void {
    if (this.canvas) {
      const ctx = this.canvas.nativeElement.getContext('2d');
      if (ctx) {
        this.chart = new Chart(ctx, {
          data: {
            datasets: []
          },
          options: {
            scales: {
              y: {
                title: {
                  display: true,
                  text: '%'
                }
              }
            }
          }
        });
      }
    }
  }

  trackByWeapon(index: number, item: IWeapon): string {
    return item.uuid;
  }

  onOptionsChange(): void {
    this.cache.set(CacheKeys.Options, this.options);
  }

  onTargetChange(): void {
    this.cache.set(CacheKeys.Target, this.target);
  }

  onWeaponChange(): void {
    this.cache.set(CacheKeys.Weapons, this.weapons);
  }

  onWeaponAddClick(): void {
    console.log(this.canvas);
    this.weapons.push({
      uuid: nanoid(),
      name: '',
      color: this.colors[this.weapons.length],
      attacks: '1',
      tohit: '3',
      strength: '4',
      ap: '-1',
      damage: '1'
    });
    this.cache.set(CacheKeys.Weapons, this.weapons);
  }

  onWeaponRemoveClick(index: number): void {
    this.weapons.splice(index, 1);
    this.cache.set(CacheKeys.Weapons, this.weapons);
  }

  async onRenderClick(): Promise<void> {
    this.loading = true;

    const simcount = Number(this.options.simcount);

    if (this.chart) {
      if (this.chart.options.scales)
        this.chart.options.scales['x'] = {
          title: {
            display: true,
            text: 'xyz'
          }
        };

      this.chart.data.datasets = [];
    }

    const worker = new Worker(new URL('./workers/attack.worker.ts', import.meta.url));
    worker.onmessage = (ev: MessageEvent<Map<string, number[]>>) => {
      console.log('worker end', new Date());

      for (const [uuid, damages] of ev.data) {
        const average = mean(damages);
        const stddev = standardDeviation(damages);

        this.results.push({
          uuid,
          mean: average,
          stddev
        });

        /* exemple :
        dmg[0] = 45 -> 45 fois 0 dégâts
        dmg[1] = undefined -> aucune fois 1 dégâts
        dmg[2] = 33 -> 33 fois 2 dégâts
        etc... */
        const dmg = damages.reduce<number[]>((p, c) => {
          const d = p[c] || 0;
          p[c] = d + 1;
          return p;
        }, []);

        const data: (number | null)[] = [];

        for (let j = 0; j < dmg.length; j++) {
          if (this.options.xaxis === '0') {
            const sum = dmg.slice(j).reduce((p, c) => p + (c || 0), 0);
            data.push(sum * 100 / simcount);
          }
          else {
            if (dmg[j] === undefined) {
              data.push(null);
            }
            else {
              data.push(dmg[j] * 100 / simcount);
            }
          }
        }

        if (this.chart) {
          this.chart.data.datasets.push({
            type: 'line',
            label: 'x',//weapon.name || 'Weapon ' + (i + 1),
            data,
            spanGaps: true,
            //borderColor: weapon.color,
            //backgroundColor: weapon.color
          });
        }

      }

      this.results = [...this.results];

      if (this.chart) {
        const max = this.chart.data.datasets.reduce((p, c) => Math.max(p, c.data.length), 0);
        const arr = new Array(max);
        this.chart.data.labels = arr.fill(undefined).map((_, index) => index);
  
        this.chart.update();
      }
  
      this.loading = false;
    };

    const data: IAttackWorkerData = {
      simcount,
      target: this.target,
      weapons: this.weapons,
    };
    worker.postMessage(data);
  }

}
