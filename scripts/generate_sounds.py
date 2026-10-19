import wave
import math
import struct
import random
import os

SAMPLE_RATE = 44100

def write_wav(filename, samples):
    out_dir = os.path.join(os.path.dirname(__file__), "..", "assets", "sounds")
    os.makedirs(out_dir, exist_ok=True)
    filepath = os.path.join(out_dir, filename)
    
    with wave.open(filepath, 'w') as wf:
        wf.setnchannels(1)  # Mono
        wf.setsampwidth(2)  # 16-bit
        wf.setframerate(SAMPLE_RATE)
        
        packed_data = bytearray()
        for s in samples:
            # Clamp to -1.0 to 1.0
            s_clamped = max(-1.0, min(1.0, s))
            int_val = int(s_clamped * 32767)
            packed_data.extend(struct.pack('<h', int_val))
        wf.writeframes(packed_data)
    
    size = os.path.getsize(filepath)
    duration_ms = len(samples) / SAMPLE_RATE * 1000
    print(f"Generated {filename}: {duration_ms:.1f}ms, {size} bytes")

def generate_income_chime():
    # Ascending two-note chime (C6 = 1046.5 Hz, G6 = 1567.98 Hz)
    # Total duration: 150ms
    duration = 0.15
    num_samples = int(duration * SAMPLE_RATE)
    samples = [0.0] * num_samples
    
    # Note 1: starts at t=0, decays by 70ms
    f1 = 1046.5
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        if t < 0.08:
            env1 = math.exp(-t * 40) * math.sin(min(1.0, t / 0.003) * math.pi / 2)
            s1 = (math.sin(2 * math.pi * f1 * t) + 0.3 * math.sin(2 * math.pi * f1 * 2 * t)) * env1
            samples[i] += s1 * 0.45

    # Note 2: starts at t=0.045, decays to end
    f2 = 1567.98
    start_t2 = 0.045
    start_i2 = int(start_t2 * SAMPLE_RATE)
    for i in range(start_i2, num_samples):
        t = (i - start_i2) / SAMPLE_RATE
        env2 = math.exp(-t * 28) * math.sin(min(1.0, t / 0.003) * math.pi / 2)
        s2 = (math.sin(2 * math.pi * f2 * t) + 0.25 * math.sin(2 * math.pi * f2 * 2 * t) + 0.1 * math.sin(2 * math.pi * f2 * 3 * t)) * env2
        samples[i] += s2 * 0.55

    write_wav("income_chime.wav", samples)

def generate_expense_whoosh():
    # Quiet papery whoosh / air friction glide (80ms)
    duration = 0.08
    num_samples = int(duration * SAMPLE_RATE)
    samples = [0.0] * num_samples
    
    # Low-pass filtered noise with a downward pitch envelope
    random.seed(42)
    last_noise = 0.0
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        # Envelope: smooth attack up to 20ms, quick decay down to 80ms
        if t < 0.02:
            env = math.sin(t / 0.02 * math.pi / 2)
        else:
            env = math.cos((t - 0.02) / 0.06 * math.pi / 2) ** 2
        
        # White noise smoothed to soft pink/brown noise
        raw_noise = random.uniform(-1.0, 1.0)
        smoothed = last_noise * 0.75 + raw_noise * 0.25
        last_noise = smoothed
        
        # Subtle downward glide tone
        sweep_freq = 380 - (t / duration) * 220
        glide = math.sin(2 * math.pi * sweep_freq * t) * 0.25
        
        samples[i] = (smoothed * 0.65 + glide * 0.35) * env * 0.35

    write_wav("expense_whoosh.wav", samples)

def generate_goal_bell():
    # Warm bell milestone harmonic (160ms)
    duration = 0.16
    num_samples = int(duration * SAMPLE_RATE)
    samples = [0.0] * num_samples
    
    # Triad harmonic: C5 (523.25), E5 (659.25), G5 (783.99), plus high shimmer
    f_root = 523.25
    f_third = 659.25
    f_fifth = 783.99
    
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        # Envelope: instantaneous strike (1ms attack), bell exponential ring
        attack = math.sin(min(1.0, t / 0.002) * math.pi / 2)
        env = attack * math.exp(-t * 22)
        
        tone = (
            0.5 * math.sin(2 * math.pi * f_root * t) +
            0.35 * math.sin(2 * math.pi * f_third * t) +
            0.3 * math.sin(2 * math.pi * f_fifth * t) +
            0.15 * math.sin(2 * math.pi * f_root * 3 * t)
        )
        samples[i] = tone * env * 0.55

    write_wav("goal_bell.wav", samples)

def generate_budget_hum():
    # Low tonal warm hum (100ms)
    duration = 0.10
    num_samples = int(duration * SAMPLE_RATE)
    samples = [0.0] * num_samples
    
    f = 196.0  # G3
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        # Envelope: soft bell curve (rounded attack 20ms, rounded release 80ms)
        if t < 0.02:
            env = math.sin(t / 0.02 * math.pi / 2)
        else:
            env = math.cos((t - 0.02) / 0.08 * math.pi / 2)
        
        tone = math.sin(2 * math.pi * f * t) + 0.2 * math.sin(2 * math.pi * f * 2 * t)
        samples[i] = tone * env * 0.40

    write_wav("budget_hum.wav", samples)

def generate_refresh_click():
    # Crisp mechanical dial click (24ms)
    duration = 0.024
    num_samples = int(duration * SAMPLE_RATE)
    samples = [0.0] * num_samples
    
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        # Fast double transient
        if t < 0.008:
            env1 = math.exp(-t * 600)
            tone1 = math.sin(2 * math.pi * 3200 * t) * env1
        else:
            tone1 = 0
            
        t2 = t - 0.008
        if t2 >= 0:
            env2 = math.exp(-t2 * 450)
            tone2 = math.sin(2 * math.pi * 4800 * t2) * env2
        else:
            tone2 = 0
            
        samples[i] = (tone1 * 0.6 + tone2 * 0.4) * 0.60

    write_wav("refresh_click.wav", samples)

if __name__ == "__main__":
    generate_income_chime()
    generate_expense_whoosh()
    generate_goal_bell()
    generate_budget_hum()
    generate_refresh_click()
    print("All sounds generated successfully!")
