import { AfterViewInit, Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { nanoid } from 'nanoid';
import { mean, median, standardDeviation } from 'simple-statistics';
import { COLORS } from './consts/colors';
import { XAXISLABELS } from './consts/x-axis-labels';
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
  @ViewChildren('form') private forms?: QueryList<ElementRef<HTMLFormElement>>;

  options = this.cache.get<IOptions>(CacheKeys.Options, {
    simcount: '100000',
    xaxis: 'Minimum damage'
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

  colors = COLORS;
  xaxis = XAXISLABELS;

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
                beginAtZero: true,
                ticks: {
                  callback: value => value + '%'
                }
              }
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: item => item.dataset.label + ' : ' + item.formattedValue + '%'
                }
              }
            }
          },
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
    this.weapons.push({
      uuid: nanoid(),
      name: '',
      color: this.colors[this.weapons.length],
      attacks: '1',
      tohit: '3',
      strength: '4',
      ap: '-1',
      damage: '1',
      hitrollmod: '0',
      woundrollmod: '0',
      onhit6additionalhits: '',
      onwound6mortalwounds: '',
    });
    this.cache.set(CacheKeys.Weapons, this.weapons);
  }

  onWeaponRemoveClick(index: number): void {
    this.weapons.splice(index, 1);
    this.cache.set(CacheKeys.Weapons, this.weapons);
  }

  onCalculateClick(): void {
    if (this.forms) {
      for (const form of this.forms) {
        const isvalid = form.nativeElement.reportValidity();
        if (!isvalid) return;
      }
    }

    this.loading = true;

    if (this.chart) {
      if (this.chart.options.scales) {
        this.chart.options.scales['x'] = {
          title: {
            display: true,
            text: this.options.xaxis
          }
        };
      }

      if (this.chart.options.plugins && this.chart.options.plugins.tooltip && this.chart.options.plugins.tooltip.callbacks) {
        this.chart.options.plugins.tooltip.callbacks.title = items => this.options.xaxis + ' : ' + items[0].label
      }

      this.chart.data.datasets = [];
      this.chart.update();
    }

    const worker = new Worker(new URL('./workers/attack.worker.ts', import.meta.url));
    worker.onmessage = (ev: MessageEvent<Map<string, number[]>>) => {
      for (const [uuid, damages] of ev.data) {
        this.results.push({
          uuid,
          mean: mean(damages),
          stddev: standardDeviation(damages),
          median: median(damages)
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

        for (let i = 0; i < dmg.length; i++) {
          if (this.options.xaxis === 'Minimum damage') {
            const sum = dmg.slice(i).reduce((p, c) => p + (c || 0), 0);
            data.push(sum * 100 / damages.length);
          }
          else {
            if (dmg[i] === undefined) {
              data.push(null);
            }
            else {
              data.push(dmg[i] * 100 / damages.length);
            }
          }
        }

        if (this.chart) {
          const index = this.weapons.findIndex(x => x.uuid === uuid);
          if (index !== -1) {
            const weapon = this.weapons[index];
            this.chart.data.datasets.push({
              type: 'line',
              label: weapon.name || 'Weapon ' + (index + 1),
              data,
              spanGaps: true,
              borderColor: weapon.color,
              backgroundColor: weapon.color,
            });
          }
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
      simcount: Number(this.options.simcount),
      target: this.target,
      weapons: this.weapons,
    };
    worker.postMessage(data);
  }

}
