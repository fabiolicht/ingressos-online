<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Venda extends Model
{
    protected $fillable = [
        'evento_id',
        'quantidade',
        'status',
    ];
}
