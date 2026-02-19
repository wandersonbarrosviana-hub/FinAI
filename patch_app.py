import sys
import os

def patch_file(file_path, start_line, end_line, new_content):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # lines is 0-indexed, start_line/end_line are 1-indexed
    lines[start_line-1:end_line] = [new_content + '\n']
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)

if __name__ == "__main__":
    file_path = sys.argv[1]
    start_line = int(sys.argv[2])
    end_line = int(sys.argv[3])
    # The new content is read from stdin to allow multiline easily
    new_content = sys.stdin.read()
    patch_file(file_path, start_line, end_line, new_content)
