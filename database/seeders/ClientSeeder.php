<?php

namespace Database\Seeders;

use App\Models\Client;
use Illuminate\Database\Seeder;

class ClientSeeder extends Seeder
{
    public function run(): void
    {
        $clients = [
            [
                'company_name' => 'PT Maju Terus',
                'contact_name' => 'Budi Santoso',
                'email' => 'budi@majuterus.com',
                'phone' => '081234567890',
                'address' => 'Jl. Sudirman No. 45, Jakarta Pusat',
            ],
            [
                'company_name' => 'CV Karya Gemilang',
                'contact_name' => 'Siti Aminah',
                'email' => 'siti@karyagemilang.com',
                'phone' => '089876543210',
                'address' => 'Jl. Diponegoro No. 12, Bandung',
            ],
            [
                'company_name' => 'Northwind Coffee',
                'contact_name' => 'Elena Ruiz',
                'email' => 'elena@northwindcoffee.com',
                'phone' => '082112223344',
                'address' => 'Jl. Kayu Manis No. 8, Yogyakarta',
            ],
            [
                'company_name' => 'Peak Fitness',
                'contact_name' => 'Andre Wijaya',
                'email' => 'andre@peakfitness.id',
                'phone' => '081377889900',
                'address' => 'Jl. Gatot Subroto No. 21, Surabaya',
            ],
        ];

        foreach ($clients as $client) {
            Client::updateOrCreate(['company_name' => $client['company_name']], $client);
        }
    }
}
