import os
import sys
import re
import json
import subprocess
import argparse

def get_desktop_output_dir():
    """Gets the path to the Optimized_Videos folder on the user's Desktop."""
    try:
        desktop = os.path.join(os.path.expanduser("~"), "Desktop")
        out_dir = os.path.join(desktop, "Optimized_Videos")
        os.makedirs(out_dir, exist_ok=True)
        return out_dir
    except Exception:
        local_dir = os.path.join(os.getcwd(), "Optimized_Videos")
        os.makedirs(local_dir, exist_ok=True)
        return local_dir

def parse_time_to_seconds(hh, mm, ss, ms=0):
    """Converts a duration format (HH:MM:SS.ms) into total seconds."""
    return int(hh) * 3600 + int(mm) * 60 + int(ss) + float(f"0.{ms}")

def probe_video(input_path):
    """Runs a quick pre-flight FFmpeg probe to find duration and audio presence."""
    cmd = ["ffmpeg", "-i", input_path]
    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        stdout, stderr = process.communicate(timeout=5)
        log = stderr.decode("utf-8", errors="ignore")
        
        duration = None
        duration_match = re.search(r"Duration:\s*(\d{2}):(\d{2}):(\d{2})\.(\d{2})", log)
        if duration_match:
            hh, mm, ss, ms = duration_match.groups()
            duration = parse_time_to_seconds(hh, mm, ss, ms)
            duration_str = f"{hh}:{mm}:{ss}"
        else:
            duration_str = "Unknown"
            
        has_audio = "Audio:" in log
        
        return duration, duration_str, has_audio
    except Exception:
        return None, "Unknown", True

def execute_ffmpeg(cmd, total_seconds, output_path):
    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            bufsize=0
        )
    except FileNotFoundError:
        return False, "FFmpeg not found in system PATH. Please ensure FFmpeg is installed and added to your environment variables.", 0
    except Exception as e:
        return False, f"Failed to start FFmpeg subprocess: {str(e)}", 0

    time_regex = re.compile(r"time=\s*(\d{2}):(\d{2}):(\d{2})\.(\d{2})")
    buffer = bytearray()
    last_line = ""

    while True:
        char = process.stderr.read(1)
        if not char:
            if process.poll() is not None:
                break
            continue

        b = char[0]
        if b in (13, 10):
            if buffer:
                try:
                    line = buffer.decode("utf-8", errors="ignore").strip()
                except Exception:
                    line = ""
                buffer = bytearray()

                if line:
                    last_line = line
                    time_match = time_regex.search(line)
                    if time_match and total_seconds > 0:
                        hh, mm, ss, ms = time_match.groups()
                        current_seconds = parse_time_to_seconds(hh, mm, ss, ms)
                        percent = min(99, int((current_seconds / total_seconds) * 100))
                        
                        print(json.dumps({
                            "status": "processing",
                            "percent": percent,
                            "time_elapsed": f"{hh}:{mm}:{ss}",
                            "current_seconds": current_seconds
                        }))
                        sys.stdout.flush()
            continue
        else:
            buffer.append(b)

    return_code = process.poll()
    if return_code == 0:
        output_size = 0
        try:
            if os.path.exists(output_path):
                output_size = os.path.getsize(output_path)
        except Exception:
            pass
        return True, "", output_size
    else:
        remaining_err = ""
        try:
            remaining_bytes = process.stderr.read()
            if remaining_bytes:
                remaining_err = remaining_bytes.decode("utf-8", errors="ignore")
        except Exception:
            pass
        
        err_msg = remaining_err.strip() if remaining_err.strip() else last_line
        return False, f"FFmpeg failed with exit code {return_code}. Details: {err_msg}", 0

def main():
    parser = argparse.ArgumentParser(description="Offline Video Toolbox Daemon")
    parser.add_argument("--input", required=True, help="Absolute path to the input video file")
    parser.add_argument("--output", help="Optional absolute path to the output file")
    parser.add_argument("--output-dir", help="Optional absolute path to the output directory")
    
    # Toolbox Action Selector
    parser.add_argument("--action", default="compress", choices=["compress", "convert", "edit", "extract_audio", "gif"], help="Toolbox Action")
    
    # Compressor / Transcoder settings
    parser.add_argument("--mode", default="quality", choices=["quality", "target_size"], help="Compression mode")
    parser.add_argument("--crf", type=int, default=23, help="CRF value (18-28) for quality mode")
    parser.add_argument("--preset", default="fast", help="Vite speed preset (ultrafast to slow)")
    parser.add_argument("--target-size", type=float, default=25.0, help="Target file size in MB")
    parser.add_argument("--resolution", default="original", choices=["original", "1080p", "720p", "480p"], help="Output height")
    parser.add_argument("--gpu", default="none", choices=["none", "nvidia", "intel", "amd"], help="GPU hardware acceleration")
    parser.add_argument("--mute", action="store_true", help="Strip audio track")
    
    # NEW: Phase 1 Advanced Settings
    parser.add_argument("--container", default="mp4", choices=["mp4", "mkv", "webm", "gif"], help="Output container format")
    parser.add_argument("--video-codec", default="h264", choices=["h264", "h265", "av1"], help="Output video codec")
    parser.add_argument("--audio-codec", default="aac", choices=["aac", "mp3", "flac", "opus"], help="Output audio codec")
    parser.add_argument("--filter-deinterlace", action="store_true", help="Apply yadif deinterlace filter")
    parser.add_argument("--filter-denoise", action="store_true", help="Apply hqdn3d denoise filter")
    parser.add_argument("--filter-grayscale", action="store_true", help="Apply grayscale color filter")

    # Video Editor settings
    parser.add_argument("--start-time", help="Start time stamp for trim (HH:MM:SS)")
    parser.add_argument("--end-time", help="End time stamp for trim (HH:MM:SS)")
    parser.add_argument("--rotation", default="none", choices=["none", "90_cw", "90_ccw", "180"], help="Rotation adjustment")
    parser.add_argument("--crop", help="Crop filter string, format W:H:X:Y")
    parser.add_argument("--scale", help="Scale filter string, format W:H")
    parser.add_argument("--pad", help="Pad filter string, format W:H:X:Y:Color")
    parser.add_argument("--subtitle", help="Absolute path to subtitle file (.srt, .vtt)")
    parser.add_argument("--subtitle-style", help="ASS force_style string for subtitles")
    
    args = parser.parse_args()

    input_path = os.path.abspath(args.input)
    
    if not os.path.exists(input_path):
        print(json.dumps({"status": "error", "error": f"Input file not found at: {input_path}"}))
        sys.stdout.flush()
        sys.exit(1)

    # Pre-flight Probe
    total_seconds, duration_str, has_audio = probe_video(input_path)
    if total_seconds is None or total_seconds <= 0:
        total_seconds = 1.0

    # Determine Output Path based on container
    if args.output:
        output_path = os.path.abspath(args.output)
    else:
        out_dir = os.path.abspath(args.output_dir) if args.output_dir else get_desktop_output_dir()
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        if args.action == "extract_audio":
            output_path = os.path.join(out_dir, f"{base_name}_audio.mp3")
        elif args.action == "gif":
            output_path = os.path.join(out_dir, f"{base_name}_clip.gif")
        else:
            output_path = os.path.join(out_dir, f"{base_name}_{args.action}.{args.container}")

    # Build FFmpeg Command
    cmd = ["ffmpeg", "-y", "-i", input_path, "-threads", "0"]

    # --- ACTION 1: COMPRESS ---
    if args.action == "compress":
        
        # Select Base Codec based on User choice and GPU choice
        vcodec = "libx264"
        if args.video_codec == "h264":
            if args.gpu == "nvidia": vcodec = "h264_nvenc"
            elif args.gpu == "intel": vcodec = "h264_qsv"
            elif args.gpu == "amd": vcodec = "h264_amf"
        elif args.video_codec == "h265":
            vcodec = "libx265"
            if args.gpu == "nvidia": vcodec = "hevc_nvenc"
            elif args.gpu == "intel": vcodec = "hevc_qsv"
            elif args.gpu == "amd": vcodec = "hevc_amf"
        elif args.video_codec == "av1":
            vcodec = "libaom-av1"
            if args.gpu == "nvidia": vcodec = "av1_nvenc"
            elif args.gpu == "intel": vcodec = "av1_qsv"
            elif args.gpu == "amd": vcodec = "av1_amf"
            
        cmd += ["-vcodec", vcodec]

        # Bitrate / Quality Mode
        if args.mode == "quality":
            if "nvenc" in vcodec or "amf" in vcodec:
                cmd += ["-cq", str(args.crf)]
            elif "qsv" in vcodec:
                cmd += ["-global_quality", str(args.crf)]
            elif args.video_codec == "av1" and vcodec == "libaom-av1":
                cmd += ["-crf", str(args.crf), "-b:v", "0"] # AV1 specific CRF
            else:
                cmd += ["-crf", str(args.crf)]
        else:
            audio_bitrate = 0 if (args.mute or not has_audio) else 128000
            target_bits = args.target_size * 1024 * 1024 * 8
            video_bitrate = (target_bits / total_seconds) - audio_bitrate
            video_bitrate = max(100000, min(video_bitrate, 50000000))
            cmd += ["-b:v", f"{int(video_bitrate)}", "-maxrate", f"{int(video_bitrate * 1.5)}", "-bufsize", f"{int(video_bitrate * 2)}"]
        
        # Preset (libaom-av1 uses cpu-used instead of preset usually, but standard FFmpeg handles it or ignores it for hardware)
        if "nvenc" in vcodec:
            cmd += ["-preset", "p4"] # nvenc uses p1-p7
        elif "qsv" in vcodec or "amf" in vcodec:
            pass # ignore preset for qsv/amf simplified
        elif vcodec == "libaom-av1":
            cmd += ["-cpu-used", "5"] # libaom-av1 mapping
        else:
            cmd += ["-preset", args.preset]

        # Setup Video Filters
        vfilters = []
        if args.filter_deinterlace:
            vfilters.append("yadif")
        if args.filter_denoise:
            vfilters.append("hqdn3d")
        if args.filter_grayscale:
            vfilters.append("colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3")
            
        # Resolution scaling
        if args.resolution == "1080p":
            vfilters.append("scale=min(1920,iw):-2")
        elif args.resolution == "720p":
            vfilters.append("scale=min(1280,iw):-2")
        elif args.resolution == "480p":
            vfilters.append("scale=min(854,iw):-2")

        if vfilters:
            cmd += ["-vf", ",".join(vfilters)]

        # Audio handling
        if args.mute or not has_audio:
            cmd += ["-an"]
        else:
            acodec = "aac"
            if args.audio_codec == "mp3": acodec = "libmp3lame"
            elif args.audio_codec == "flac": acodec = "flac"
            elif args.audio_codec == "opus": acodec = "libopus"
            cmd += ["-c:a", acodec]
            if acodec != "flac":
                cmd += ["-b:a", "128k"]

    # --- ACTION 2: CONVERT ---
    elif args.action == "convert":
        # Simplified conversion uses the same advanced settings now
        # Left for backward compatibility if needed, but we recommend 'compress'
        cmd += ["-vcodec", "libx264", "-c:a", "aac", "-b:a", "128k"]

    # --- ACTION 3: EDIT (TRIM / ROTATE / CROP / SCALE) ---
    elif args.action == "edit":
        # Build video filters for rotation, crop, scale, and pad
        filters = []
        if args.crop:
            filters.append(f"crop={args.crop}")
        if args.scale:
            filters.append(f"scale={args.scale}")
        if args.pad:
            filters.append(f"pad={args.pad}")
            
        if args.rotation == "90_cw":
            filters.append("transpose=1")
        elif args.rotation == "90_ccw":
            filters.append("transpose=2")
        elif args.rotation == "180":
            filters.append("hflip")
            filters.append("vflip")

        if args.subtitle:
            # Escape windows paths for ffmpeg filters: C:/ -> C\:/
            sub_path = args.subtitle.replace('\\', '/').replace(':', '\\:')
            sub_filter = f"subtitles='{sub_path}'"
            if args.subtitle_style:
                sub_filter += f":force_style='{args.subtitle_style}'"
            filters.append(sub_filter)

        if filters:
            cmd += ["-vf", ",".join(filters)]

        # Apply trimming timestamps
        if args.start_time:
            cmd += ["-ss", args.start_time]
        if args.end_time:
            cmd += ["-to", args.end_time]

        # Use CPU H264 for editor output to guarantee frame-accuracy on trims
        cmd += ["-vcodec", "libx264"]
        
        if args.mute or not has_audio:
            cmd += ["-an"]
        else:
            cmd += ["-c:a", "aac", "-b:a", "128k"]

    # --- ACTION 4: EXTRACT AUDIO ---
    elif args.action == "extract_audio":
        cmd += ["-vn", "-c:a", "libmp3lame", "-q:a", "2"]

    # --- ACTION 5: GIF CREATOR ---
    elif args.action == "gif":
        if args.start_time:
            cmd += ["-ss", args.start_time]
        if args.end_time:
            cmd += ["-to", args.end_time]
            
        cmd += ["-vf", "fps=12,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse", "-loop", "0"]

    # Faststart for mp4 to optimize web playback experience
    if output_path.lower().endswith(".mp4"):
        cmd += ["-movflags", "+faststart"]

    # Output path
    cmd.append(output_path)

    # Log initial status
    print(json.dumps({
        "status": "started",
        "input_path": input_path,
        "output_path": output_path,
        "file_name": os.path.basename(input_path),
        "original_size": os.path.getsize(input_path)
    }))
    print(json.dumps({
        "status": "duration_parsed",
        "total_seconds": total_seconds,
        "duration_str": duration_str
    }))
    sys.stdout.flush()

    success, error_msg, output_size = execute_ffmpeg(cmd, total_seconds, output_path)
    
    # Fallback to software encoding if hardware encoding fails
    if not success and args.action == "compress" and args.gpu != "none":
        print(json.dumps({
            "status": "error",
            "error": "Hardware encoding failed. Falling back to CPU..."
        }))
        sys.stdout.flush()
        
        # Modify cmd to use software encoding
        cmd_fallback = list(cmd)
        
        try:
            vcodec_idx = cmd_fallback.index("-vcodec")
            if args.video_codec == "h264": cmd_fallback[vcodec_idx + 1] = "libx264"
            elif args.video_codec == "h265": cmd_fallback[vcodec_idx + 1] = "libx265"
            elif args.video_codec == "av1": cmd_fallback[vcodec_idx + 1] = "libaom-av1"
            
            if "-preset" in cmd_fallback:
                preset_idx = cmd_fallback.index("-preset")
                if cmd_fallback[preset_idx + 1] == "p4":
                    cmd_fallback[preset_idx + 1] = args.preset
            else:
                # Insert -preset fast (or user preset) before the output file path (last index)
                cmd_fallback.insert(-1, "-preset")
                cmd_fallback.insert(-1, args.preset)
                
            if "-cq" in cmd_fallback:
                cmd_fallback[cmd_fallback.index("-cq")] = "-crf"
            elif "-global_quality" in cmd_fallback:
                cmd_fallback[cmd_fallback.index("-global_quality")] = "-crf"
                
            success, error_msg, output_size = execute_ffmpeg(cmd_fallback, total_seconds, output_path)
        except ValueError:
            pass
            
    if success:
        print(json.dumps({
            "status": "completed",
            "percent": 100,
            "output_path": output_path,
            "output_size": output_size
        }))
    else:
        print(json.dumps({
            "status": "error",
            "error": error_msg
        }))
        
    sys.stdout.flush()

if __name__ == "__main__":
    main()
